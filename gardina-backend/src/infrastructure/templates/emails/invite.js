import { wrap, btn, escape } from './_layout.js';

export default function invite({ appUrl, organizationName, inviterName, role, acceptUrl, expiresInDays }, lang = 'ru') {
  const roleLabel = {
    ru: { admin: 'администратора', manager: 'менеджера', sales_manager: 'менеджера продаж', designer: 'дизайнера', production: 'сотрудника производства', installer: 'монтажника' },
    kz: { admin: 'әкімшіні', manager: 'менеджерді', sales_manager: 'сатылым менеджерін', designer: 'дизайнерді', production: 'өндіріс қызметкерін', installer: 'орнатушыны' },
  }[lang === 'kz' ? 'kz' : 'ru'][role] || (lang === 'kz' ? 'қызметкерді' : 'сотрудника');

  const t = {
    ru: {
      subject: `${escape(inviterName || 'Команда')} приглашает вас в ${escape(organizationName || 'Gardina')}`,
      hello: 'Здравствуйте',
      lead: `<b>${escape(inviterName || '')}</b> приглашает вас присоединиться к команде <b>${escape(organizationName || '')}</b> в роли ${escape(roleLabel)}.`,
      body: `Чтобы принять приглашение и придумать пароль — нажмите кнопку. Ссылка действительна ${expiresInDays} дней.`,
      cta: 'Принять приглашение',
      whatIs: 'Что такое Gardina? Это рабочая система для салона штор: клиенты, замеры, КП, производство и оплаты в одном месте.',
    },
    kz: {
      subject: `${escape(inviterName || 'Команда')} сізді ${escape(organizationName || 'Gardina')} салонына шақырады`,
      hello: 'Сәлеметсіз бе',
      lead: `<b>${escape(inviterName || '')}</b> сізді <b>${escape(organizationName || '')}</b> командасына ${escape(roleLabel)} ретінде қосылуға шақырады.`,
      body: `Шақыруды қабылдау және пароль ойлап табу үшін — түймені басыңыз. Сілтеме ${expiresInDays} күн жарамды.`,
      cta: 'Шақыруды қабылдау',
      whatIs: 'Gardina не? Бұл — перде салонына арналған жұмыс жүйесі: клиенттер, өлшем, КП, өндіріс және төлемдер бір жерде.',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  const body = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800">${escape(t.hello)}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.5">${t.lead}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${escape(t.body)}</p>

    ${btn(acceptUrl, t.cta)}

    <p style="margin:24px 0 0;font-size:13px;color:#4d5c54">${escape(t.whatIs)}</p>
  `;

  return {
    subject: t.subject,
    html: wrap({ title: t.subject, body, lang }),
    text: `${t.hello}\n\n${t.lead.replace(/<[^>]+>/g, '')}\n${t.body}\n\n${t.cta}: ${acceptUrl}`,
  };
}
