import { wrap, btn, escape } from './_layout.js';

export default function verifyEmail({ appUrl, name, verifyUrl }, lang = 'ru') {
  const t = {
    ru: {
      subject: 'Подтвердите ваш email — Gardina',
      hello: name ? `Здравствуйте, ${escape(name)}!` : 'Здравствуйте!',
      lead: 'Подтвердите email-адрес, чтобы защитить ваш аккаунт и получать важные уведомления.',
      cta: 'Подтвердить email',
      expires: 'Ссылка действительна 24 часа.',
      ignore: 'Если вы не регистрировались в Gardina — просто проигнорируйте это письмо.',
    },
    kz: {
      subject: 'Email-мекенжайыңызды растаңыз — Gardina',
      hello: name ? `Сәлеметсіз бе, ${escape(name)}!` : 'Сәлеметсіз бе!',
      lead: 'Аккаунтыңызды қорғау және маңызды хабарламаларды алу үшін email-мекенжайыңызды растаңыз.',
      cta: 'Email-ді растау',
      expires: 'Сілтеме 24 сағат жарамды.',
      ignore: 'Егер Gardina-да тіркелмеген болсаңыз — бұл хатты елемеңіз.',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">${t.hello}</h1>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.5">${escape(t.lead)}</p>

    ${btn(verifyUrl, t.cta)}

    <p style="margin:20px 0 0;font-size:13px;color:#4d5c54">${escape(t.expires)}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#4d5c54">${escape(t.ignore)}</p>
  `;

  return {
    subject: t.subject,
    html: wrap({ title: t.subject, body, lang }),
    text: `${t.hello}\n\n${t.lead}\n\n${t.cta}: ${verifyUrl}\n\n${t.expires}\n${t.ignore}`,
  };
}
