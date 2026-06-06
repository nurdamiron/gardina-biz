import pool from '../../../infrastructure/database/config.js';
import { purgeDemoData } from '../../../application/services/SeedService.js';

/**
 * Onboarding checklist controller.
 *
 * The checklist is computed live from DB state — no extra columns to
 * keep in sync. Each item is "done" if the corresponding action has
 * happened. Steps:
 *   1. registered          — always done by the time user hits the app
 *   2. first_client_added  — clients exist that are NOT is_sample
 *   3. first_measurement   — measurements row exists
 *   4. first_proposal      — at least one deal moved past lead/scheduled
 *   5. team_invited        — at least one user beyond the original admin
 *   6. plan_chosen         — subscription_status != 'trial' OR explicit
 *                              plan via organization_plan_events
 */
export class OnboardingController {
  async getChecklist(req, res) {
    try {
      const orgId = req.user.organizationId;

      const [orgRes, clientsRes, measRes, dealsRes, usersRes] = await Promise.all([
        pool.query(
          `SELECT subscription_status, current_plan_code, trial_ends_at
           FROM organizations WHERE id = $1`,
          [orgId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM clients
           WHERE organization_id = $1 AND COALESCE(is_sample, false) = false`,
          [orgId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM measurements WHERE organization_id = $1`,
          [orgId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM deals
           WHERE organization_id = $1 AND status NOT IN ('lead', 'measurement_scheduled', 'cancelled')`,
          [orgId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS n FROM users
           WHERE organization_id = $1 AND is_active = true`,
          [orgId]
        ),
      ]);

      const org = orgRes.rows[0] || {};
      const planChosen =
        (org.subscription_status && org.subscription_status !== 'trial') ||
        org.current_plan_code === 'pro' || org.current_plan_code === 'network';

      const items = [
        {
          id: 'registered',
          done: true,
          label_ru: 'Аккаунт создан',
          label_kz: 'Аккаунт құрылды',
        },
        {
          id: 'first_client',
          done: clientsRes.rows[0].n > 0,
          label_ru: 'Добавьте первого реального клиента',
          label_kz: 'Алғашқы нақты клиентті қосыңыз',
          link: '/admin/client/new',
        },
        {
          id: 'first_measurement',
          done: measRes.rows[0].n > 0,
          label_ru: 'Запланируйте первый замер',
          label_kz: 'Алғашқы өлшемді жоспарлаңыз',
          link: '/admin/order/new',
        },
        {
          id: 'first_deal_moved',
          done: dealsRes.rows[0].n > 0,
          label_ru: 'Доведите сделку до КП или дальше',
          label_kz: 'Мәмілені КП-ға дейін немесе одан әрі жеткізіңіз',
        },
        {
          id: 'team_invited',
          done: usersRes.rows[0].n > 1,
          label_ru: 'Пригласите сотрудника в команду',
          label_kz: 'Командаға қызметкер шақырыңыз',
          link: '/admin/users',
        },
        {
          id: 'plan_chosen',
          done: planChosen,
          label_ru: 'Выберите тариф (после триала)',
          label_kz: 'Тарифті таңдаңыз (триалдан кейін)',
          link: '/onboarding/plan',
        },
      ];

      const completed = items.filter((i) => i.done).length;
      return res.json({
        success: true,
        data: {
          completed,
          total: items.length,
          progress: Math.round((completed / items.length) * 100),
          items,
        },
      });
    } catch (e) {
      console.error('[OnboardingController.getChecklist]', e.message);
      return res.status(500).json({ success: false, error: 'Failed to load checklist' });
    }
  }

  async purgeSamples(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Only admin can clear sample data' });
      }
      await purgeDemoData(req.user.organizationId);
      return res.json({ success: true });
    } catch (e) {
      console.error('[OnboardingController.purgeSamples]', e.message);
      return res.status(500).json({ success: false, error: 'Failed to purge sample data' });
    }
  }
}
