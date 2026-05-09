import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../../../infrastructure/database/config.js';
import { emailService } from '../../../infrastructure/services/EmailService.js';

const TOKEN_BYTES = 32;
const TOKEN_TTL_MIN = 30;

function hashIdentifier(value) {
  if (!value) return 'anonymous';
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Password reset flow controller.
 *
 * Two endpoints, both public (no auth required):
 * - POST /api/auth/password-reset/request   — { email | phone } → always 200
 * - POST /api/auth/password-reset/confirm   — { token, newPassword } → 200 or 400
 *
 * Security notes:
 * - The /request endpoint NEVER reveals whether the account exists.
 *   It always returns 200 with the same shape, regardless of whether
 *   the user was found. This prevents account enumeration through the
 *   reset endpoint.
 * - Tokens are stored hashed (sha256). The raw token only exists in
 *   the email body and the URL the user clicks.
 * - Tokens are single-use: confirming sets used_at and the row can no
 *   longer be redeemed.
 * - Token expires after 30 minutes (TOKEN_TTL_MIN).
 */
export class PasswordResetController {
  async request(req, res) {
    try {
      const { email, phone, login } = req.body || {};
      const identifier = (email || phone || login || '').trim();
      const lang = (req.headers['accept-language'] || '').toLowerCase().includes('kk') ? 'kz' : 'ru';

      if (!identifier) {
        return res.status(400).json({ success: false, error: 'email or phone required' });
      }

      // Find user globally — we don't require organizationSlug here so anyone
      // who knows their email/phone can recover. If two users share a login
      // across tenants, both get reset emails.
      const userRes = await pool.query(
        `SELECT u.id, u.name, u.email, u.organization_id, o.slug AS organization_slug
         FROM users u
         JOIN organizations o ON o.id = u.organization_id
         WHERE u.is_active = true AND (u.email = $1 OR u.phone = $1)`,
        [identifier]
      );

      // Always respond with success to prevent account enumeration.
      const successResponse = {
        success: true,
        message: 'Если аккаунт существует, мы отправили инструкцию на email.',
      };

      if (userRes.rows.length === 0) {
        console.log(`[PasswordReset] no user for principal=${hashIdentifier(identifier)}`);
        return res.json(successResponse);
      }

      // Issue tokens for each matched user (rare: same login in multiple orgs)
      for (const user of userRes.rows) {
        if (!user.email) {
          // No email on file — can't deliver. Skip silently. SMS-OTP would
          // cover this case once we have an SMS provider.
          continue;
        }

        const rawToken = crypto.randomBytes(TOKEN_BYTES).toString('hex');
        const tokenHash = hashToken(rawToken);
        const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);

        await pool.query(
          `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, ip, user_agent)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, tokenHash, expiresAt, req.ip, req.headers['user-agent'] || null]
        );

        const appUrl = process.env.APP_URL || 'https://app.gardina.kz';
        const resetUrl = `${appUrl}/reset-password?token=${rawToken}&slug=${encodeURIComponent(user.organization_slug)}`;

        emailService
          .send('password-reset', user.email, {
            name: user.name,
            resetUrl,
            expiresInMinutes: TOKEN_TTL_MIN,
          }, lang)
          .catch((err) => console.error(`[PasswordReset] email send failed: ${err.message}`));
      }

      return res.json(successResponse);
    } catch (error) {
      console.error(`[PasswordReset.request] ${error.message}`);
      // Even on internal errors we keep the same response shape — easier to
      // debug from logs and we don't leak server state.
      return res.json({
        success: true,
        message: 'Если аккаунт существует, мы отправили инструкцию на email.',
      });
    }
  }

  async confirm(req, res) {
    try {
      const { token, newPassword } = req.body || {};

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token is required' });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }

      const tokenHash = hashToken(token);
      const tokenRes = await pool.query(
        `SELECT t.id, t.user_id, t.expires_at, t.used_at
         FROM password_reset_tokens t
         WHERE t.token_hash = $1`,
        [tokenHash]
      );

      const row = tokenRes.rows[0];
      if (!row) {
        return res.status(400).json({ success: false, error: 'Token invalid or expired' });
      }
      if (row.used_at) {
        return res.status(400).json({ success: false, error: 'Token already used' });
      }
      if (new Date(row.expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: 'Token expired' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
          [passwordHash, row.user_id]
        );
        await client.query(
          `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
          [row.id]
        );
        // Invalidate all OTHER unused reset tokens for this user — defence
        // in depth: if an attacker leaked one token, they can't have a spare.
        await client.query(
          `UPDATE password_reset_tokens SET used_at = NOW()
           WHERE user_id = $1 AND used_at IS NULL AND id <> $2`,
          [row.user_id, row.id]
        );
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }

      return res.json({ success: true });
    } catch (error) {
      console.error(`[PasswordReset.confirm] ${error.message}`);
      return res.status(500).json({ success: false, error: 'Internal error' });
    }
  }
}
