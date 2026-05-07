import pool from '../../../infrastructure/database/config.js';

function computeReadOnlyState(subscriptionStatus, trialEndsAt) {
  if (subscriptionStatus === 'active') return false;
  if (subscriptionStatus === 'trial' && trialEndsAt) {
    return new Date(trialEndsAt).getTime() < Date.now();
  }
  return subscriptionStatus === 'past_due' || subscriptionStatus === 'canceled';
}

function daysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export class BillingController {
  async status(req, res) {
    try {
      const organizationId = req.user.organizationId;
      const usageRes = await pool.query(
        'SELECT COUNT(*)::int AS users_count FROM users WHERE organization_id = $1 AND is_active = true',
        [organizationId]
      );
      const usage = usageRes.rows[0];

      const billingRes = await pool.query(
        `SELECT o.id, o.name, o.slug, o.current_plan_code, o.billing_cycle, o.subscription_status,
                o.trial_started_at, o.trial_ends_at, o.read_only_since, o.max_users_override,
                o.max_salons_override,
                p.name AS plan_name, p.description AS plan_description,
                p.max_users, p.max_salons, p.has_production_workflow, p.has_inventory, p.has_network_analytics
         FROM organizations o
         LEFT JOIN subscription_plans p ON p.code = o.current_plan_code
         WHERE o.id = $1`,
        [organizationId]
      );

      if (!billingRes.rows[0]) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const row = billingRes.rows[0];
      const isReadOnly = computeReadOnlyState(row.subscription_status, row.trial_ends_at);

      return res.json({
        success: true,
        data: {
          organization: {
            id: row.id,
            name: row.name,
            slug: row.slug,
          },
          billing: {
            planCode: row.current_plan_code,
            planName: row.plan_name,
            planDescription: row.plan_description,
            billingCycle: row.billing_cycle,
            subscriptionStatus: row.subscription_status,
            trialStartedAt: row.trial_started_at,
            trialEndsAt: row.trial_ends_at,
            trialDaysLeft: daysLeft(row.trial_ends_at),
            isReadOnly,
            readOnlySince: row.read_only_since,
            limits: {
              users: row.max_users_override ?? row.max_users,
              salons: row.max_salons_override ?? row.max_salons,
            },
            features: {
              productionWorkflow: Boolean(row.has_production_workflow),
              inventory: Boolean(row.has_inventory),
              networkAnalytics: Boolean(row.has_network_analytics),
            },
            usage: {
              activeUsers: usage.users_count,
            },
          },
        },
      });
    } catch (error) {
      console.error(`[BillingController.status] ${error.message}`);
      return res.status(500).json({ success: false, error: 'Failed to load billing status' });
    }
  }

  async selectPlan(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admin can change plan' });
      }

      const { planCode, billingCycle = 'monthly' } = req.body;
      if (!['start', 'pro', 'network'].includes(planCode)) {
        return res.status(400).json({ success: false, error: 'Invalid planCode' });
      }
      if (!['monthly', 'yearly'].includes(billingCycle)) {
        return res.status(400).json({ success: false, error: 'Invalid billingCycle' });
      }

      // Server-controlled subscription status. The client cannot pass `active`
      // for a paid plan — that requires a verified PSP webhook (not yet
      // implemented). Until then, paid plans are queued as `pending_payment`
      // and the org stays on whatever the previous status was.
      //
      // - start  : free tier, immediately active
      // - pro/network without active payment: pending_payment (read-only mutations
      //   continue to be blocked by enforceReadOnly until webhook arrives)
      const organizationId = req.user.organizationId;
      const prevRes = await pool.query(
        'SELECT current_plan_code, billing_cycle, subscription_status FROM organizations WHERE id = $1',
        [organizationId]
      );
      const prev = prevRes.rows[0];
      if (!prev) return res.status(404).json({ success: false, error: 'Organization not found' });

      let nextStatus;
      if (planCode === 'start') {
        nextStatus = 'active';
      } else if (prev.subscription_status === 'active' && prev.current_plan_code !== 'start') {
        // Already paying — staying on paid plan (just changing tier or cycle)
        nextStatus = 'active';
      } else {
        nextStatus = 'pending_payment';
      }

      await pool.query(
        `UPDATE organizations
         SET current_plan_code = $1,
             billing_cycle = $2,
             subscription_status = $3,
             read_only_since = CASE WHEN $3 = 'active' THEN NULL ELSE read_only_since END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [planCode, billingCycle, nextStatus, organizationId]
      );

      await pool.query(
        `INSERT INTO organization_plan_events (
            organization_id, actor_user_id, event_type,
            from_plan_code, to_plan_code,
            from_status, to_status,
            from_billing_cycle, to_billing_cycle
         ) VALUES ($1, $2, 'plan_changed', $3, $4, $5, $6, $7, $8)`,
        [
          organizationId,
          req.user.id,
          prev.current_plan_code,
          planCode,
          prev.subscription_status,
          nextStatus,
          prev.billing_cycle,
          billingCycle,
        ]
      );

      return this.status(req, res);
    } catch (error) {
      console.error(`[BillingController.selectPlan] ${error.message}`);
      return res.status(500).json({ success: false, error: 'Failed to change plan' });
    }
  }

  async startProTrial(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admin can start trial' });
      }

      const organizationId = req.user.organizationId;
      await pool.query(
        `UPDATE organizations
         SET current_plan_code = 'pro',
             billing_cycle = COALESCE(billing_cycle, 'monthly'),
             subscription_status = 'trial',
             trial_started_at = CURRENT_TIMESTAMP,
             trial_ends_at = CURRENT_TIMESTAMP + INTERVAL '7 days',
             read_only_since = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [organizationId]
      );

      await pool.query(
        `INSERT INTO organization_plan_events (
            organization_id, actor_user_id, event_type, to_plan_code, to_status, details
         ) VALUES ($1, $2, 'trial_started', 'pro', 'trial', '{"durationDays":7}'::jsonb)`,
        [organizationId, req.user.id]
      );

      return this.status(req, res);
    } catch (error) {
      console.error(`[BillingController.startProTrial] ${error.message}`);
      return res.status(500).json({ success: false, error: 'Failed to start trial' });
    }
  }
}

