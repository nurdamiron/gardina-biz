import crypto from 'node:crypto';
import pool from '../../../infrastructure/database/config.js';
import { PostgresUserRepository } from '../../../infrastructure/repositories/PostgresUserRepository.js';
import { PostgresOrganizationRepository } from '../../../infrastructure/repositories/PostgresOrganizationRepository.js';
import { AuthService } from '../../../infrastructure/services/AuthService.js';
import { emailService } from '../../../infrastructure/services/EmailService.js';
import { seedDemoData } from '../../../application/services/SeedService.js';
import { blacklistToken } from '../middleware/auth.middleware.js';

/**
 * Returns a short hash of an identifier for log correlation without leaking
 * the original phone/email value into log files.
 */
function redactIdentifier(value) {
  if (!value) return 'anonymous';
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 8);
}

// Same pattern as PasswordResetController: store the hash, email the raw
// token, never persist the raw value. Duplicated rather than imported to
// avoid coupling two independently-owned auth flows over one shared helper.
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function normalizeOrgSlug(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function isOrgReadOnly(user) {
  if (!user?.subscription_status) return false;
  if (user.subscription_status === 'active') return false;
  if (user.subscription_status === 'trial') {
    if (!user.trial_ends_at) return false;
    return new Date(user.trial_ends_at).getTime() < Date.now();
  }
  return user.subscription_status === 'past_due' || user.subscription_status === 'canceled';
}

function trialDaysLeft(trialEndsAt) {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Authentication Controller
 */
export class AuthController {
  constructor() {
    this.userRepository = new PostgresUserRepository();
    this.organizationRepository = new PostgresOrganizationRepository();
    this.authService = new AuthService();
  }

  /**
   * POST /api/auth/register
   * Register a new user
   */
  async register(req, res) {
    try {
      const { name, email, phone, password } = req.body;
      const role = 'designer'; // Role is always 'designer' for self-registration; admin assigns roles separately

      // Validate input
      if (!name || !phone || !password) {
        return res.status(400).json({
          success: false,
          error: 'Аты, телефон және құпия сөз қажет',
        });
      }

      const organizationSlug = normalizeOrgSlug(req.body.organizationSlug);
      if (!organizationSlug) {
        return res.status(400).json({
          success: false,
          error: 'organizationSlug қажет (салонның slug)',
        });
      }

      const org = await this.organizationRepository.findBySlug(organizationSlug);
      if (!org) {
        return res.status(404).json({
          success: false,
          error: 'Салон табылмады',
        });
      }

      const existingUserByPhone = await this.userRepository.findByPhoneInOrganization(phone, org.id);
      if (existingUserByPhone) {
        return res.status(409).json({
          success: false,
          error: 'Бұл телефон нөмірі тіркелген',
        });
      }

      if (email) {
        const existingUserByEmail = await this.userRepository.findByEmailInOrganization(email, org.id);
        if (existingUserByEmail) {
          return res.status(409).json({
            success: false,
            error: 'Бұл email тіркелген',
          });
        }
      }

      // Hash password
      const passwordHash = await this.authService.hashPassword(password);

      // Create user
      const user = await this.userRepository.create({
        organizationId: org.id,
        name,
        email,
        phone,
        passwordHash,
        role,
      });

      // Generate tokens
      const tokens = this.authService.generateTokenPair(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          ...tokens,
        },
        message: 'Тіркелу сәтті өтті',
      });
    } catch (error) {
      console.error(`[AuthController.register] Failed for principal=${redactIdentifier(req.body.phone)}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Тіркелу сәтсіз аяқталды',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/auth/register-salon
   * Create a new organization (tenant) and its first admin user.
   */
  async registerSalon(req, res) {
    const client = await pool.connect();
    try {
      const { organizationName, name, phone, password, email } = req.body;
      let { organizationSlug } = req.body;
      organizationSlug = normalizeOrgSlug(organizationSlug || '');

      if (!organizationName?.trim() || !organizationSlug || !name?.trim() || !phone?.trim() || !password) {
        return res.status(400).json({
          success: false,
          error: 'organizationName, organizationSlug, name, phone, password қажет',
        });
      }

      if (organizationSlug.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'organizationSlug кемінде 2 таңба (латын, сан, дефис)',
        });
      }

      const existingSlug = await this.organizationRepository.findBySlug(organizationSlug);
      if (existingSlug) {
        return res.status(409).json({
          success: false,
          error: 'Бұл slug бұрыннан бар — басқа таңдаңыз',
        });
      }

      await client.query('BEGIN');

      const orgRes = await client.query(
        `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug`,
        [organizationName.trim(), organizationSlug]
      );
      const orgId = orgRes.rows[0].id;

      const dupPhone = await client.query(
        'SELECT 1 FROM users WHERE organization_id = $1 AND phone = $2',
        [orgId, phone.trim()]
      );
      if (dupPhone.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ success: false, error: 'Бұл телефон нөмірі тіркелген' });
      }

      if (email?.trim()) {
        const dupEmail = await client.query(
          'SELECT 1 FROM users WHERE organization_id = $1 AND email = $2',
          [orgId, email.trim()]
        );
        if (dupEmail.rows.length > 0) {
          await client.query('ROLLBACK');
          return res.status(409).json({ success: false, error: 'Бұл email тіркелген' });
        }
      }

      const passwordHash = await this.authService.hashPassword(password);
      const userRes = await client.query(
        `INSERT INTO users (organization_id, name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'admin')
         RETURNING id, name, email, phone, role`,
        [orgId, name.trim(), email?.trim() || null, phone.trim(), passwordHash]
      );

      // Seed demo data inside the same transaction so first-run experience
      // isn't an empty product. The user can wipe samples from the admin
      // panel later via DELETE /api/onboarding/sample-data.
      await seedDemoData(client, orgId);

      await client.query('COMMIT');

      const user = userRes.rows[0];
      const tokens = this.authService.generateTokenPair(user);

      // Welcome email + verification email — fire and forget, don't block the response.
      if (user.email) {
        const lang = (req.headers['accept-language'] || '').toLowerCase().includes('kk') ? 'kz' : 'ru';
        emailService
          .send('welcome', user.email, {
            name: user.name,
            organizationName: orgRes.rows[0].name,
            organizationSlug: orgRes.rows[0].slug,
          }, lang)
          .catch((e) => console.error(`[registerSalon] welcome email failed: ${e.message}`));
        // Send email verification link
        this._sendVerificationEmail(user.id, user.email, user.name, req)
          .catch((e) => console.error(`[registerSalon] verify email failed: ${e.message}`));
      }

      res.status(201).json({
        success: true,
        data: {
          organization: orgRes.rows[0],
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          },
          ...tokens,
        },
        message: 'Салон және әкімші тіркелді',
      });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`[AuthController.registerSalon] ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Тіркелу сәтсіз аяқталды',
        message: error.message,
      });
    } finally {
      client.release();
    }
  }

  /**
   * POST /api/auth/login
   * Login user
   */
  async login(req, res) {
    try {
      const { login: loginField, phone, email, password, organizationSlug: orgSlugRaw } = req.body;

      if ((!loginField && !phone && !email) || !password) {
        return res.status(400).json({
          success: false,
          error: 'Логин және құпия сөз қажет',
        });
      }

      const identifier = loginField || phone || email;
      const organizationSlug = normalizeOrgSlug(orgSlugRaw || '');

      let user;
      if (organizationSlug) {
        const org = await this.organizationRepository.findBySlug(organizationSlug);
        if (!org) {
          // Same shape as wrong-credentials to avoid org-existence enumeration
          return res.status(401).json({
            success: false,
            error: 'Логин немесе құпия сөз қате',
          });
        }
        user = await this.userRepository.findByLoginInOrganization(identifier, org.id);
      } else {
        const matches = await this.userRepository.findAllByLoginGlobally(identifier);
        if (matches.length === 0) {
          // Same response shape as wrong password — no enumeration of which
          // logins are registered.
          return res.status(401).json({
            success: false,
            error: 'Логин немесе құпия сөз қате',
          });
        } else if (matches.length > 1) {
          // Verify password against ALL matches; only orgs where the password
          // is actually correct are returned. This way attackers cannot map
          // a phone number to the salons it belongs to without also
          // knowing the password — same privacy guarantee as a normal login.
          const verified = [];
          for (const m of matches) {
            // eslint-disable-next-line no-await-in-loop
            if (await this.authService.verifyPassword(password, m.password_hash)) {
              verified.push(m);
            }
          }
          if (verified.length === 0) {
            return res.status(401).json({
              success: false,
              error: 'Логин немесе құпия сөз қате',
            });
          }
          if (verified.length === 1) {
            user = verified[0];
          } else {
            return res.status(400).json({
              success: false,
              code: 'ORG_SLUG_REQUIRED',
              error: 'Бірнеше салонда осындай логин бар — organizationSlug көрсетіңіз',
              organizations: verified.map((u) => ({
                slug: u.organization_slug,
                name: u.organization_name,
              })),
            });
          }
        } else {
          user = matches[0];
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Логин немесе құпия сөз қате',
        });
      }

      const isPasswordValid = await this.authService.verifyPassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Логин немесе құпия сөз қате',
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: 'Аккаунт өшірілген',
        });
      }

      await this.userRepository.updateLastLogin(user.id);

      const tokens = this.authService.generateTokenPair(user);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatar_url,
            organizationSlug: user.organization_slug,
            organizationName: user.organization_name,
          },
          ...tokens,
        },
        message: 'Сәтті кірдіңіз',
      });
    } catch (error) {
      console.error(`[AuthController.login] Login failed for principal=${redactIdentifier(req.body.phone || req.body.email || req.body.login)}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Кіру сәтсіз аяқталды',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/auth/me
   * Get current user profile
   */
  async me(req, res) {
    try {
      // User is already attached by auth middleware
      const user = await this.userRepository.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Пайдаланушы табылмады',
        });
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: Boolean(user.email_verified || user.email_verified_at),
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatar_url,
          isActive: user.is_active,
          createdAt: user.created_at,
          organization: user.organization_slug
            ? { slug: user.organization_slug, name: user.organization_name }
            : null,
          billing: {
            planCode: user.current_plan_code || 'start',
            billingCycle: user.billing_cycle || 'monthly',
            subscriptionStatus: user.subscription_status || 'trial',
            trialStartedAt: user.trial_started_at || null,
            trialEndsAt: user.trial_ends_at || null,
            trialDaysLeft: trialDaysLeft(user.trial_ends_at),
            isReadOnly: isOrgReadOnly(user),
            readOnlySince: user.read_only_since || null,
          },
        },
      });
    } catch (error) {
      console.error(`[AuthController.me] Failed to get profile for user ${req.user?.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Профильді жүктеу сәтсіз аяқталды',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Refresh access token using refresh token
   */
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token қажет',
        });
      }

      // Verify refresh token
      const decoded = this.authService.verifyRefreshToken(refreshToken);

      // Get user
      const user = await this.userRepository.findByIdUnscoped(decoded.id);

      if (!user || !user.is_active) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token жарамсыз',
        });
      }

      // Generate new tokens
      const tokens = this.authService.generateTokenPair(user);

      res.json({
        success: true,
        data: tokens,
        message: 'Token сәтті жаңартылды',
      });
    } catch (error) {
      console.error(`[AuthController.refreshToken] Token refresh failed: ${error.message}`);
      res.status(401).json({
        success: false,
        error: 'Token жарамсыз немесе мерзімі өтіп кеткен',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/auth/verify-email?token=xxx
   * Verify email address using token sent to user's email
   */
  async verifyEmail(req, res) {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token жоқ' });
    }
    const tokenHash = hashToken(token);
    try {
      const result = await pool.query(
        `SELECT user_id, expires_at, used_at
         FROM email_verification_tokens
         WHERE token_hash = $1`,
        [tokenHash]
      );
      const row = result.rows[0];
      if (!row) {
        return res.status(400).json({ success: false, error: 'Токен жарамсыз немесе қолданылған' });
      }
      if (row.used_at) {
        return res.status(400).json({ success: false, error: 'Токен бұрын қолданылған' });
      }
      if (new Date(row.expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: 'Токен мерзімі өтіп кеткен' });
      }
      await pool.query(
        `UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1`,
        [row.user_id]
      );
      await pool.query(
        `UPDATE email_verification_tokens SET used_at = NOW() WHERE token_hash = $1`,
        [tokenHash]
      );
      return res.json({ success: true, message: 'Email сәтті расталды' });
    } catch (error) {
      console.error(`[AuthController.verifyEmail] ${error.message}`);
      return res.status(500).json({ success: false, error: 'Растау сәтсіз аяқталды' });
    }
  }

  /**
   * POST /api/auth/resend-verification
   * Resend email verification link (rate limited by caller)
   */
  async resendVerification(req, res) {
    try {
      const user = await this.userRepository.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, error: 'Пайдаланушы табылмады' });
      if (user.email_verified) {
        return res.json({ success: true, message: 'Email бұрыннан расталған' });
      }
      if (!user.email) {
        return res.status(400).json({ success: false, error: 'Email мекенжайы жоқ' });
      }
      await this._sendVerificationEmail(user.id, user.email, user.name, req);
      return res.json({ success: true, message: 'Растау хаты жіберілді' });
    } catch (error) {
      console.error(`[AuthController.resendVerification] ${error.message}`);
      return res.status(500).json({ success: false, error: 'Жіберу сәтсіз аяқталды' });
    }
  }

  async _sendVerificationEmail(userId, email, name, req) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, email, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE
         SET token_hash = $3, expires_at = $4, used_at = NULL, created_at = NOW()`,
      [userId, email, tokenHash, expiresAt]
    );
    const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'https://app.gardina.kz';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;
    const lang = (req?.headers?.['accept-language'] || '').toLowerCase().includes('kk') ? 'kz' : 'ru';
    emailService
      .send('verify-email', email, { name, verifyUrl }, lang)
      .catch((e) => console.error(`[AuthController] verify-email send failed: ${e.message}`));
  }

  /**
   * POST /api/auth/logout
   * Logout user — blacklists the current token so it becomes immediately invalid
   */
  async logout(req, res) {
    try {
      // Invalidate the current access token via the in-memory blacklist
      if (req.tokenDecoded) {
        blacklistToken(req.tokenDecoded);
      }

      res.json({
        success: true,
        message: 'Сәтті шықтыңыз',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Шығу сәтсіз аяқталды',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/auth/me
   * Self-service account deletion (required by App Store Guideline 5.1.1(v)).
   * Requires password re-confirmation. Performs GDPR-style erasure: personal data
   * is stripped and the account is deactivated so it can never log in again, while
   * the organization's business records that reference the user are preserved.
   * Guards against the last active admin orphaning a whole tenant.
   */
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body || {};

      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Аккаунтты жою үшін құпия сөзбен растаңыз',
        });
      }

      // findByIdUnscoped returns password_hash + role + organization_id.
      const user = await this.userRepository.findByIdUnscoped(userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Пайдаланушы табылмады' });
      }

      const passwordOk = await this.authService.verifyPassword(password, user.password_hash);
      if (!passwordOk) {
        return res.status(401).json({ success: false, error: 'Құпия сөз қате' });
      }

      // Last-admin guard: deleting the sole admin would orphan the whole salon.
      if (user.role === 'admin') {
        const adminCount = await this.userRepository.countActiveAdmins(user.organization_id);
        if (adminCount <= 1) {
          return res.status(409).json({
            success: false,
            code: 'LAST_ADMIN',
            error:
              'Сіз салонның жалғыз әкімшісісіз. Алдымен әкімші құқығын басқа қызметкерге беріңіз немесе қолдау қызметіне хабарласыңыз.',
          });
        }
      }

      // Set an unusable password hash so the (now anonymized) row can never authenticate.
      const deadHash = await this.authService.hashPassword(crypto.randomBytes(24).toString('hex'));
      await this.userRepository.anonymizeAndDeactivate(userId, deadHash);

      // Immediately invalidate the current access token.
      if (req.tokenDecoded) {
        blacklistToken(req.tokenDecoded);
      }

      return res.json({
        success: true,
        message: 'Аккаунт жойылды',
      });
    } catch (error) {
      console.error(`[AuthController.deleteAccount] Failed for user ${req.user?.id}: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: 'Аккаунтты жою сәтсіз аяқталды',
        message: error.message,
      });
    }
  }
}
