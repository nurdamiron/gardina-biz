import { wrap, btn, escape } from './_layout.js';

export default function passwordReset({ appUrl, name, resetUrl, expiresInMinutes }, lang = 'ru') {
  const t = {
    ru: {
      subject: 'Сброс пароля Gardina',
      hello: name ? `Здравствуйте, ${name}` : 'Здравствуйте',
      lead: 'Вы (или кто-то от вашего имени) запросили сброс пароля.',
      body: `Чтобы установить новый пароль, нажмите кнопку ниже. Ссылка действительна в течение ${expiresInMinutes} минут.`,
      cta: 'Установить новый пароль',
      ignore: 'Если это не вы — просто проигнорируйте письмо. Старый пароль остаётся действительным.',
      orPaste: 'Если кнопка не работает, скопируйте ссылку в браузер:',
    },
    kz: {
      subject: 'Gardina парольді қалпына келтіру',
      hello: name ? `Сәлеметсіз бе, ${name}` : 'Сәлеметсіз бе',
      lead: 'Сіз (немесе сіздің атыңыздан) парольді қалпына келтіруді сұрадыңыз.',
      body: `Жаңа парольді орнату үшін төмендегі түймені басыңыз. Сілтеме ${expiresInMinutes} минут жарамды.`,
      cta: 'Жаңа пароль орнату',
      ignore: 'Бұл сіз болмасаңыз — хатты елемеңіз. Ескі пароль әлі жарамды.',
      orPaste: 'Түйме жұмыс істемесе, сілтемені браузерге көшіріңіз:',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">${escape(t.hello)}</h1>
    <p style="margin:0 0 8px;font-size:16px;line-height:1.5">${escape(t.lead)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(t.body)}</p>

    ${btn(resetUrl, t.cta)}

    <p style="margin:16px 0 8px;font-size:12px;color:#4d5c54">${escape(t.orPaste)}</p>
    <p style="margin:0 0 16px;font-size:12px;color:#4d5c54;word-break:break-all"><a href="${escape(resetUrl)}" style="color:#1b5e45">${escape(resetUrl)}</a></p>

    <p style="margin:24px 0 0;font-size:13px;color:#9cb0a4">${escape(t.ignore)}</p>
  `;

  return {
    subject: t.subject,
    html: wrap({ title: t.subject, body, lang }),
    text: `${t.hello}\n\n${t.lead}\n${t.body}\n\n${resetUrl}\n\n${t.ignore}`,
  };
}
