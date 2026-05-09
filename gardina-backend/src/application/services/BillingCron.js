import pool from '../../infrastructure/database/config.js';
import { emailService } from '../../infrastructure/services/EmailService.js';

/**
 * Billing background worker. No external scheduler — just setInterval
 * launched once at server boot from server.js. The worker is idempotent
 * thanks to the *_email_sent_at columns on organizations: each email
 * fires at most once per organization per state transition.
 *
 * Pass-through schedule (one tick per hour):
 *  1. Trial-warning  — orgs whose trial_ends_at falls in the next 48 hours
 *                       and that haven't received the warning yet.
 *  2. Trial-expired  — orgs whose trial_ends_at has passed and status is
 *                       still 'trial'. Switch to past_due, send email.
 *  3. Auto-cancel    — orgs in past_due for >14 days. Switch to canceled,
 *                       send goodbye email.
 *  4. Stale tokens   — delete password_reset_tokens that are >7d old (they
 *                       expire after 30 minutes anyway, this just cleans up).
 *
 * Each step catches its own errors so a failure on step 1 doesn't break
 * steps 2-4.
 */

const HOUR_MS = 60 * 60 * 1000;

export function startBillingCron({ intervalMs = HOUR_MS } = {}) {
  if (process.env.DISABLE_CRON === '1') {
    console.log('[BillingCron] disabled via DISABLE_CRON=1');
    return null;
  }

  // Run once shortly after boot so a freshly-deployed server doesn't have
  // to wait an hour to do its first check. Stagger by 30s so the very
  // first request after deploy doesn't compete with cron for DB time.
  const initial = setTimeout(() => runOnce().catch(noop), 30 * 1000);
  const id = setInterval(() => runOnce().catch(noop), intervalMs);

  console.log(`[BillingCron] scheduled: every ${Math.round(intervalMs / 1000)}s`);

  return {
    stop: () => {
      clearTimeout(initial);
      clearInterval(id);
    },
    runOnce,
  };
}

async function runOnce() {
  const startedAt = Date.now();
  console.log('[BillingCron] tick start');

  await safe('warnTrialEnding', warnTrialEnding);
  await safe('expireTrials', expireTrials);
  await safe('cancelPastDue', cancelPastDue);
  await safe('cleanupStaleTokens', cleanupStaleTokens);

  console.log(`[BillingCron] tick done in ${Date.now() - startedAt}ms`);
}

async function safe(name, fn) {
  try {
    const n = await fn();
    if (n != null) console.log(`[BillingCron.${name}] processed ${n}`);
  } catch (e) {
    console.error(`[BillingCron.${name}] failed: ${e.message}`);
  }
}

function noop() {}

// ─────────────────────────────────────────────────────────────────────────
// 1. Trial-warning: 48h before trial ends
// ─────────────────────────────────────────────────────────────────────────

async function warnTrialEnding() {
  // Find orgs in trial whose trial_ends_at is between NOW and NOW+48h
  // and trial_warning_sent_at is null.
  const r = await pool.query(`
    SELECT o.id, o.name, o.trial_ends_at,
           u.email AS admin_email, u.name AS admin_name
    FROM organizations o
    JOIN users u ON u.organization_id = o.id AND u.role = 'admin' AND u.is_active = true
    WHERE o.subscription_status = 'trial'
      AND o.trial_warning_sent_at IS NULL
      AND o.trial_ends_at IS NOT NULL
      AND o.trial_ends_at > NOW()
      AND o.trial_ends_at <= NOW() + INTERVAL '48 hours'
  `);

  for (const row of r.rows) {
    if (!row.admin_email) continue;
    const daysLeft = Math.max(1, Math.ceil((new Date(row.trial_ends_at) - new Date()) / (24 * 60 * 60 * 1000)));
    await emailService.send('trial-warning', row.admin_email, {
      name: row.admin_name,
      daysLeft,
    });
    await pool.query(
      `UPDATE organizations SET trial_warning_sent_at = NOW() WHERE id = $1`,
      [row.id]
    );
  }
  return r.rows.length;
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Expire trials: trial_ends_at has passed
// ─────────────────────────────────────────────────────────────────────────

async function expireTrials() {
  const r = await pool.query(`
    SELECT o.id, o.name, u.email AS admin_email, u.name AS admin_name
    FROM organizations o
    JOIN users u ON u.organization_id = o.id AND u.role = 'admin' AND u.is_active = true
    WHERE o.subscription_status = 'trial'
      AND o.trial_ends_at IS NOT NULL
      AND o.trial_ends_at <= NOW()
  `);

  for (const row of r.rows) {
    // Move to past_due so the read-only middleware kicks in. Actual
    // cancellation happens 14 days later (cancelPastDue).
    await pool.query(
      `UPDATE organizations
       SET subscription_status = 'past_due',
           read_only_since = COALESCE(read_only_since, NOW()),
           updated_at = NOW(),
           trial_expired_email_sent_at = NOW()
       WHERE id = $1`,
      [row.id]
    );

    if (row.admin_email) {
      await emailService.send('trial-expired', row.admin_email, { name: row.admin_name });
    }

    await pool.query(
      `INSERT INTO organization_plan_events (organization_id, event_type, from_status, to_status, details)
       VALUES ($1, 'trial_expired', 'trial', 'past_due', '{"reason":"trial_period_ended"}'::jsonb)`,
      [row.id]
    ).catch(() => { /* event log optional */ });
  }
  return r.rows.length;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Cancel past-due orgs after 14 days
// ─────────────────────────────────────────────────────────────────────────

async function cancelPastDue() {
  const r = await pool.query(`
    SELECT o.id, u.email AS admin_email
    FROM organizations o
    JOIN users u ON u.organization_id = o.id AND u.role = 'admin' AND u.is_active = true
    WHERE o.subscription_status = 'past_due'
      AND o.read_only_since IS NOT NULL
      AND o.read_only_since < NOW() - INTERVAL '14 days'
      AND o.canceled_email_sent_at IS NULL
  `);

  for (const row of r.rows) {
    await pool.query(
      `UPDATE organizations
       SET subscription_status = 'canceled',
           canceled_email_sent_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [row.id]
    );
    // No dedicated "your org is canceled" email yet — log only. When we
    // need it, drop another template into emails/canceled.js and add a
    // send call here.
  }
  return r.rows.length;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. Token cleanup
// ─────────────────────────────────────────────────────────────────────────

async function cleanupStaleTokens() {
  // Delete password reset tokens older than 7 days regardless of state.
  // Tokens already expire after 30min, this is just hygiene.
  const r = await pool.query(`
    DELETE FROM password_reset_tokens
    WHERE created_at < NOW() - INTERVAL '7 days'
  `);
  return r.rowCount;
}
