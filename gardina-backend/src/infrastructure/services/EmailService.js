import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email service: thin wrapper over nodemailer + a JS-module template
 * registry. Each template lives in src/infrastructure/templates/emails/<name>.js
 * and exports a function (vars, lang) => ({ subject, html, text }).
 *
 * If SMTP credentials are not set the service falls back to a "log-only"
 * mode so dev environments without SMTP don't crash — failed sends are
 * visible in logs and treated as soft-success.
 */
export class EmailService {
  constructor() {
    this.from = process.env.EMAIL_FROM || 'Gardina <noreply@gardina.kz>';
    this.appUrl = process.env.APP_URL || 'https://app.gardina.kz';
    this.transporter = null;
    this.isConfigured = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        // gmail / yandex / mailgun all accept these defaults
      });
    } else {
      console.warn('[EmailService] SMTP not configured — emails will be logged but not sent');
    }
  }

  /**
   * Send a templated email.
   *
   * @param {string} templateName  matches a file in templates/emails/<name>.js
   * @param {string} to            recipient email
   * @param {object} vars          variables passed to template
   * @param {string} [lang='ru']   'ru' or 'kz'
   */
  async send(templateName, to, vars = {}, lang = 'ru') {
    if (!to) {
      console.warn(`[EmailService] no recipient for template ${templateName}`);
      return { success: false, error: 'no_recipient' };
    }

    let template;
    try {
      const mod = await import(`../templates/emails/${templateName}.js`);
      template = mod.default || mod[templateName];
    } catch (err) {
      console.error(`[EmailService] template not found: ${templateName}`, err.message);
      return { success: false, error: 'template_missing' };
    }

    const { subject, html, text } = template(
      { appUrl: this.appUrl, ...vars },
      lang === 'kz' ? 'kz' : 'ru'
    );

    if (!this.isConfigured) {
      console.log(`[EmailService] (log-only) → ${to} :: ${subject}`);
      return { success: true, mode: 'log-only' };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] send failed for ${templateName} → ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }
}

export const emailService = new EmailService();
