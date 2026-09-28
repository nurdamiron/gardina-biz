import { wrap, btn, escape } from './_layout.js';

export default function trialExpired({ appUrl, name }, lang = 'ru') {
  const t = {
    ru: {
      subject: 'Пробный период Gardina завершён',
      hello: name ? `Здравствуйте, ${name}` : 'Здравствуйте',
      lead: 'Пробный период Gardina Pro завершён.',
      body: 'Ваш аккаунт переведён в режим только-чтения: данные доступны, но создание новых записей временно ограничено.',
      restore: 'Чтобы восстановить полный доступ — выберите тариф:',
      cta: 'Выбрать тариф',
      data: 'Все ваши данные сохранены и не удаляются.',
      help: 'Если у вас есть вопросы — WhatsApp +7 707 942 9827',
    },
    kz: {
      subject: 'Gardina сынақ кезеңі аяқталды',
      hello: name ? `Сәлеметсіз бе, ${name}` : 'Сәлеметсіз бе',
      lead: 'Gardina Pro сынақ кезеңі аяқталды.',
      body: 'Аккаунтыңыз тек оқу режиміне ауысты: деректер қол жетімді, бірақ жаңа жазбалар қосу уақытша шектелген.',
      restore: 'Толық қол жеткізуді қалпына келтіру үшін — тариф таңдаңыз:',
      cta: 'Тариф таңдау',
      data: 'Барлық деректеріңіз сақталды, жойылмады.',
      help: 'Сұрақтарыңыз болса — WhatsApp +7 707 942 9827',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">${escape(t.hello)}</h1>
    <p style="margin:0 0 8px;font-size:16px;line-height:1.5">${escape(t.lead)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(t.body)}</p>

    <p style="margin:16px 0 8px;font-size:15px">${escape(t.restore)}</p>
    ${btn(`${appUrl}/onboarding/plan`, t.cta)}

    <p style="margin:20px 0 8px;font-size:13px;color:#4d5c54">${escape(t.data)}</p>
    <p style="margin:0;font-size:13px;color:#4d5c54">${escape(t.help)}</p>
  `;

  return {
    subject: t.subject,
    html: wrap({ title: t.subject, body, lang }),
    text: `${t.hello}\n${t.lead}\n\n${t.body}\n\n${t.restore}\n${appUrl}/onboarding/plan\n\n${t.data}`,
  };
}
