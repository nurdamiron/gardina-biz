import { wrap, btn, escape } from './_layout.js';

export default function trialWarning({ appUrl, name, daysLeft }, lang = 'ru') {
  const t = {
    ru: {
      subject: `${daysLeft} дн до окончания пробного периода Gardina`,
      hello: name ? `Здравствуйте, ${name}` : 'Здравствуйте',
      lead: `Ваш пробный период Gardina Pro заканчивается через <b>${daysLeft} дн</b>.`,
      bodyTitle: 'Что произойдёт дальше:',
      step1: 'Когда триал кончится — система перейдёт в режим только-чтения',
      step2: 'Все ваши данные остаются с вами и не удаляются',
      step3: 'Чтобы продолжить работу — выберите тариф ниже',
      cta: 'Выбрать тариф',
      help: 'Возникли вопросы? Напишите в WhatsApp +7 707 942 9827',
    },
    kz: {
      subject: `${daysLeft} күн Gardina сынақ кезеңі аяқталғанша`,
      hello: name ? `Сәлеметсіз бе, ${name}` : 'Сәлеметсіз бе',
      lead: `Gardina Pro сынақ кезеңіңіз <b>${daysLeft} күнде</b> аяқталады.`,
      bodyTitle: 'Әрі қарай не болады:',
      step1: 'Сынақ біткенде — жүйе тек оқу режиміне ауысады',
      step2: 'Барлық деректеріңіз сізде қалады, жойылмайды',
      step3: 'Жұмысты жалғастыру үшін — төмендегі тарифті таңдаңыз',
      cta: 'Тариф таңдау',
      help: 'Сұрақтар бар ма? WhatsApp +7 707 942 9827',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">${escape(t.hello)}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5">${t.lead}</p>

    <h2 style="margin:16px 0 8px;font-size:16px;font-weight:700">${escape(t.bodyTitle)}</h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#4d5c54">
      <li>${escape(t.step1)}</li>
      <li>${escape(t.step2)}</li>
      <li>${escape(t.step3)}</li>
    </ul>

    ${btn(`${appUrl}/onboarding/plan`, t.cta)}

    <p style="margin:20px 0 0;font-size:13px;color:#4d5c54">${escape(t.help)}</p>
  `;

  return {
    subject: t.subject,
    html: wrap({ title: t.subject, body, lang }),
    text: `${t.hello}\n${t.lead.replace(/<[^>]+>/g, '')}\n\n${t.bodyTitle}\n- ${t.step1}\n- ${t.step2}\n- ${t.step3}\n\n${t.cta}: ${appUrl}/onboarding/plan`,
  };
}
