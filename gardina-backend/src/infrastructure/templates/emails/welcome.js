import { wrap, btn, escape } from './_layout.js';

export default function welcome({ appUrl, name, organizationName, organizationSlug }, lang = 'ru') {
  const t = {
    ru: {
      subject: 'Добро пожаловать в Gardina',
      hello: name ? `Здравствуйте, ${name}!` : 'Здравствуйте!',
      lead: `Аккаунт салона <b>${escape(organizationName || '')}</b> создан. Поздравляем!`,
      body: 'Вы можете входить в систему по логину (телефон или email) и паролю. Если у вас в одном email несколько салонов — указывайте код-ссылку (slug) при входе.',
      slugLabel: 'Код вашего салона:',
      cta: 'Войти в систему',
      next: 'Что сделать в первые 5 минут:',
      step1: 'Добавить первого клиента',
      step2: 'Запланировать первый замер',
      step3: 'Пригласить дизайнера/менеджера в команду',
      step4: 'Загрузить логотип салона в настройках',
      help: 'Если что-то непонятно — пишите в WhatsApp +7 707 942 9827',
    },
    kz: {
      subject: 'Gardina-ға қош келдіңіз',
      hello: name ? `Сәлеметсіз бе, ${name}!` : 'Сәлеметсіз бе!',
      lead: `<b>${escape(organizationName || '')}</b> салонының аккаунты құрылды. Құттықтаймыз!`,
      body: 'Жүйеге логин (телефон немесе email) және парольмен кіре аласыз. Егер бір email-да бірнеше салон болса — кіру кезінде slug-ты көрсетіңіз.',
      slugLabel: 'Сіздің салон коды:',
      cta: 'Жүйеге кіру',
      next: 'Алғашқы 5 минутта не істеу керек:',
      step1: 'Алғашқы клиентті қосу',
      step2: 'Алғашқы өлшемді жоспарлау',
      step3: 'Командаға дизайнер/менеджер шақыру',
      step4: 'Баптауларда салонның логотипін жүктеу',
      help: 'Түсініксіз нәрсе болса — WhatsApp +7 707 942 9827',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">${escape(t.hello)}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5">${t.lead}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(t.body)}</p>

    ${organizationSlug ? `
    <div style="background:#f1f6f3;border:1px solid #d5e3dc;border-radius:12px;padding:14px 16px;margin:16px 0">
      <div style="font-size:12px;color:#4d5c54;font-weight:600;text-transform:uppercase;letter-spacing:0.04em">${escape(t.slugLabel)}</div>
      <div style="font-size:18px;font-weight:800;color:#1b5e45;margin-top:4px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace">${escape(organizationSlug)}</div>
    </div>` : ''}

    ${btn(`${appUrl}/login`, t.cta)}

    <h2 style="margin:24px 0 8px;font-size:16px;font-weight:700">${escape(t.next)}</h2>
    <ol style="margin:0;padding-left:20px;font-size:14px;line-height:1.7;color:#4d5c54">
      <li>${escape(t.step1)}</li>
      <li>${escape(t.step2)}</li>
      <li>${escape(t.step3)}</li>
      <li>${escape(t.step4)}</li>
    </ol>

    <p style="margin:20px 0 0;font-size:13px;color:#4d5c54">${escape(t.help)}</p>
  `;

  return {
    subject: t.subject,
    html: wrap({ title: t.subject, body, lang }),
    text: `${t.hello}\n\n${t.lead.replace(/<[^>]+>/g, '')}\n\n${t.body}\n\n${t.cta}: ${appUrl}/login\n\n${t.help}`,
  };
}
