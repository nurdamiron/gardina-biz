// Pain-first promo scripts for curtain salons.
// Screens are real Gardina UI captured on the demo salon "Айшторы" (public/screens/aishtory).
// Every caption describes something visible on that screen. *word* = highlight. Durations in seconds.

export type Lang = 'ru' | 'kz';
type T = Record<Lang, string>;

export type Scene =
  | { kind: 'chat'; sec: number; title: T; msgs: { who: T; text: T; side?: 'in' | 'out' }[] }
  | { kind: 'pain'; sec: number; text: T }
  | { kind: 'painList'; sec: number; title: T; items: T[] }
  | { kind: 'brand'; sec: number; text: T }
  // zoom > 1 enlarges the screen around focusY (screenshot px, 860x1864 screenshots)
  | { kind: 'phone'; sec: number; img: string; caption: T; zoom?: number; focusY?: number }
  | { kind: 'list'; sec: number; title: T; items: { who: T; what: T }[] }
  | { kind: 'result'; sec: number; text: T }
  | { kind: 'cta'; sec: number };

export interface Script { id: string; badge?: T; scenes: Scene[] }

const t = (ru: string, kz: string): T => ({ ru, kz });
const S = (name: string) => `screens/aishtory/${name}.png`;

const who = {
  client: t('Клиент', 'Клиент'),
  manager: t('Менеджер', 'Менеджер'),
  owner: t('Владелец', 'Иесі'),
  sewer: t('Швея', 'Тігінші'),
  measurer: t('Замерщик', 'Өлшеуші'),
  accountant: t('Бухгалтер', 'Бухгалтер'),
};

const CTA: Scene = { kind: 'cta', sec: 4 };

// Reusable real-UI shots
const shot = {
  ownerDash: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('admin-dashboard'), caption, zoom: 1.6, focusY: 400 }),
  orders: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('admin-orders'), caption }),
  dealReady: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('deal-ready'), caption, zoom: 1.1, focusY: 420 }),
  dealProd: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('deal-production'), caption, zoom: 1.1, focusY: 420 }),
  newOrder: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('manager-new-order'), caption }),
  urgent: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('manager-urgent'), caption, zoom: 1.08, focusY: 520 }),
  managerDash: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('manager-dashboard'), caption }),
  client: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('manager-client'), caption, zoom: 1.12, focusY: 520 }),
  measurements: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('designer-measurements'), caption }),
  measureSizes: (caption: T, sec = 4): Scene => ({ kind: 'phone', sec, img: S('designer-measurement-done'), caption, zoom: 2.1, focusY: 420 }),
};

export const SCRIPTS: Script[] = [
  {
    id: 'main',
    scenes: [
      {
        kind: 'chat', sec: 5.5, title: t('Рабочий чат «Айшторы» · понедельник 10:00', '«Айшторы» жұмыс чаты · дүйсенбі 10:00'),
        msgs: [
          { who: who.client, text: t('Здравствуйте, а где мой заказ?', 'Сәлеметсіз бе, тапсырысым қайда?'), side: 'in' },
          { who: who.manager, text: t('Кто брал заказ Ләззат?', 'Ләззаттың тапсырысын кім алды?') },
          { who: who.sewer, text: t('А размеры какие? В тетради не разобрать', 'Өлшемі қандай? Дәптерден түсініксіз') },
          { who: who.accountant, text: t('Предоплату кто взял?', 'Алдын ала төлемді кім алды?') },
        ],
      },
      { kind: 'pain', sec: 3.2, text: t('Заказы живут в *WhatsApp*, тетрадях и в голове у менеджера', 'Тапсырыстар *WhatsApp*-та, дәптерде және менеджердің басында жүр') },
      {
        kind: 'painList', sec: 5.5, title: t('Знакомо?', 'Таныс па?'),
        items: [
          t('Заявка потерялась, клиент ушёл', 'Өтінім жоғалды, клиент кетіп қалды'),
          t('Размеры перепутали, перешиваем', 'Өлшем шатасты, қайта тігеміз'),
          t('«Где мой заказ?» ищем полчаса', '«Тапсырысым қайда?» жарты сағат іздейміз'),
          t('«Потом оплатят» и тишина', '«Кейін төлейді» деп, үнсіздік'),
          t('Менеджер ушёл вместе с клиентами', 'Менеджер клиенттерімен бірге кетті'),
        ],
      },
      { kind: 'brand', sec: 2.8, text: t('Всё про заказ в *одном месте*', 'Тапсырыс туралы бәрі *бір жерде*') },
      shot.newOrder(t('Заявка записана за минуту и *не потеряется*', 'Өтінім бір минутта жазылады, *жоғалмайды*')),
      shot.measurements(t('Замерщик видит *адрес и время* каждого замера', 'Өлшеуші әр өлшемнің *мекенжайы мен уақытын* көреді')),
      shot.measureSizes(t('Размеры сохраняются *в системе*: 2,6 × 2,7 м', 'Өлшем *жүйеде* сақталады: 2,6 × 2,7 м')),
      shot.orders(t('У каждого заказа видно *этап и оплату*', 'Әр тапсырыстың *кезеңі мен төлемі* көрінеді')),
      shot.dealProd(t('*Оплачено 244 000, остаток 244 000*. Без «вроде»', '*Төленді 244 000, қалдық 244 000*. «Сияқты» жоқ')),
      shot.ownerDash(t('Владелец видит *выручку и замеры* с телефона', 'Иесі *табыс пен өлшемді* телефоннан көреді')),
      {
        kind: 'list', sec: 6, title: t('Каждому своё', 'Әркімге өз жұмысы'),
        items: [
          { who: who.owner, what: t('выручка, команда, оплаты', 'табыс, команда, төлем') },
          { who: who.manager, what: t('заявки, клиенты, срочные задачи', 'өтінім, клиент, шұғыл тапсырма') },
          { who: who.measurer, what: t('замеры с адресом и временем', 'мекенжай, уақыт, өлшем') },
          { who: t('Вся команда', 'Бүкіл команда'), what: t('этап заказа: пошив, монтаж', 'тапсырыс кезеңі: тігу, монтаж') },
        ],
      },
      CTA,
    ],
  },

  // ---------- roles ----------
  {
    id: 'role-owner', badge: t('Для владельца салона', 'Салон иесіне'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('Конец месяца', 'Ай соңы'),
        msgs: [
          { who: who.owner, text: t('Сколько нам ещё должны клиенты?', 'Клиенттер бізге әлі қанша қарыз?') },
          { who: who.manager, text: t('Сейчас посчитаю по тетрадям…', 'Қазір дәптерден санаймын…'), side: 'in' },
          { who: who.owner, text: t('А сколько заказов сейчас в пошиве?', 'Қазір тігуде қанша тапсырыс бар?') },
        ],
      },
      { kind: 'pain', sec: 2.8, text: t('Чтобы узнать правду о бизнесе, приходится *обзванивать всех*', 'Бизнестің шын жағдайын білу үшін *бәріне қоңырау шаласыз*') },
      shot.ownerDash(t('Замеры, клиенты, сделки, выручка *на одном экране*', 'Өлшем, клиент, мәміле, табыс *бір экранда*')),
      shot.orders(t('Все заказы: кто на замере, кто *не оплатил*', 'Барлық тапсырыс: кім өлшемде, кім *төлемеді*')),
      shot.dealProd(t('В каждом заказе: *оплачено и остаток*', 'Әр тапсырыста: *төленгені мен қалдығы*')),
      { kind: 'result', sec: 2.5, text: t('Картина бизнеса за 10 секунд. *Без звонков*', 'Бизнес көрінісі 10 секундта. *Қоңыраусыз*') },
      CTA,
    ],
  },
  {
    id: 'role-manager', badge: t('Для менеджера', 'Менеджерге'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('WhatsApp менеджера', 'Менеджердің WhatsApp-ы'),
        msgs: [
          { who: who.client, text: t('Я вчера писала, почему никто не перезвонил?', 'Кеше жаздым ғой, неге ешкім хабарласпады?'), side: 'in' },
          { who: who.client, text: t('И когда будут готовы шторы?', 'Перде қашан дайын болады?'), side: 'in' },
          { who: who.manager, text: t('Сейчас уточню у цеха…', 'Қазір цехтан сұраймын…') },
        ],
      },
      { kind: 'pain', sec: 2.8, text: t('Сотня чатов, и ответ клиенту ищешь *полчаса*', 'Жүз чат, клиентке жауапты *жарты сағат* іздейсің') },
      shot.newOrder(t('Заявка на замер *за минуту*: имя, телефон, адрес, 2ГИС', 'Өлшеуге өтінім *бір минутта*: аты, телефоны, мекенжайы, 2ГИС')),
      shot.urgent(t('*Срочные задачи*: кого подтвердить сегодня', '*Шұғыл тапсырмалар*: бүгін кімді растау керек')),
      shot.dealReady(t('Открыл заказ: *готов к монтажу*', 'Тапсырысты аштың: *монтажға дайын*')),
      { kind: 'result', sec: 2.5, text: t('Ответ клиенту за *30 секунд*', 'Клиентке жауап *30 секундта*') },
      CTA,
    ],
  },
  {
    id: 'role-measurer', badge: t('Для замерщика и дизайнера', 'Өлшеуші мен дизайнерге'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('После замера', 'Өлшемнен кейін'),
        msgs: [
          { who: who.measurer, text: t('Адрес скиньте ещё раз, пожалуйста', 'Мекенжайды тағы жіберіңізші'), side: 'in' },
          { who: who.sewer, text: t('Тут 2,40 или 2,10? Фото не видно', 'Мұнда 2,40 ма, 2,10 ма? Фото көрінбейді') },
          { who: who.measurer, text: t('Сейчас найду в галерее…', 'Қазір галереядан іздеймін…'), side: 'in' },
        ],
      },
      { kind: 'pain', sec: 2.8, text: t('Одна цифра с бумажки, и шторы *перешивают за свой счёт*', 'Қағаздағы бір цифр, перде *өз есебіңізден қайта тігіледі*') },
      shot.measurements(t('Все замеры: *клиент, адрес, время, комната*', 'Барлық өлшем: *клиент, мекенжай, уақыт, бөлме*')),
      shot.measureSizes(t('Размеры по комнатам *в системе*, а не в тетради', 'Бөлме өлшемдері дәптерде емес, *жүйеде*')),
      { kind: 'result', sec: 3, text: t('Размеры записаны *один раз* и видны всей команде', 'Өлшем *бір рет* жазылады, бүкіл командаға көрінеді') },
      CTA,
    ],
  },

  // ---------- situations ----------
  {
    id: 'sit-manager-sick', badge: t('Ситуация', 'Жағдай'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('Утро', 'Таңертең'),
        msgs: [
          { who: who.manager, text: t('Заболела, сегодня не выйду 🤒', 'Ауырып қалдым, бүгін келмеймін 🤒'), side: 'in' },
          { who: who.owner, text: t('А что мы обещали клиентке Айжан?', 'Айжан клиентке не уәде бердік?') },
          { who: who.owner, text: t('…', '…') },
        ],
      },
      { kind: 'pain', sec: 2.5, text: t('Вся история клиента была *в одном телефоне*', 'Клиенттің бүкіл тарихы *бір телефонда* еді') },
      shot.client(t('Карточка клиента: *замеры, сделки, WhatsApp*', 'Клиент картасы: *өлшем, мәміле, WhatsApp*')),
      shot.dealReady(t('Её заказ: *готов к монтажу*, остаток известен', 'Тапсырысы: *монтажға дайын*, қалдығы белгілі'), 3.5),
      { kind: 'result', sec: 2.5, text: t('История живёт *в системе*, а не в одном человеке', 'Тарих бір адамда емес, *жүйеде* сақталады') },
      CTA,
    ],
  },
  {
    id: 'sit-where-order', badge: t('Ситуация', 'Жағдай'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('WhatsApp · Айжан', 'WhatsApp · Айжан'),
        msgs: [
          { who: who.client, text: t('Добрый день! Шторы когда будут?', 'Қайырлы күн! Перде қашан болады?'), side: 'in' },
          { who: who.manager, text: t('Сейчас уточню…', 'Қазір нақтылаймын…') },
          { who: who.client, text: t('Уже 40 минут жду ответа', '40 минут жауап күтіп отырмын'), side: 'in' },
        ],
      },
      { kind: 'pain', sec: 2.5, text: t('Простой вопрос, а ответ ищут *по всему салону*', 'Қарапайым сұрақ, жауапты *бүкіл салоннан* іздейді') },
      shot.dealReady(t('Открыл заказ Айжан: *готов к монтажу*', 'Айжанның тапсырысы: *монтажға дайын*'), 4.5),
      { kind: 'result', sec: 2.5, text: t('Ответ клиенту *за 30 секунд*', 'Клиентке жауап *30 секундта*') },
      CTA,
    ],
  },
  {
    id: 'sit-wrong-size', badge: t('Ситуация', 'Жағдай'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('Цех', 'Цех'),
        msgs: [
          { who: who.sewer, text: t('Шторы короче на 30 см 😬', 'Перде 30 см қысқа шықты 😬') },
          { who: who.measurer, text: t('Я писал 2,40, а не 2,10', 'Мен 2,40 деп жаздым, 2,10 емес'), side: 'in' },
          { who: who.owner, text: t('Перешиваем за наш счёт…', 'Өз есебімізден қайта тігеміз…') },
        ],
      },
      { kind: 'pain', sec: 2.5, text: t('Одна ошибка в цифре стоит *ткани, работы и клиента*', 'Бір цифр қатесі *мата, еңбек және клиент* болып шығады') },
      shot.measureSizes(t('Замер вносится *в систему*: спальня 2,6 × 2,7 м', 'Өлшем *жүйеге* енгізіледі: жатын бөлме 2,6 × 2,7 м'), 4.5),
      { kind: 'result', sec: 2.5, text: t('Одни и те же цифры *у всей команды*', 'Бүкіл командада *бірдей цифр*') },
      CTA,
    ],
  },
  {
    id: 'sit-prepayment', badge: t('Ситуация', 'Жағдай'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('Бухгалтерия', 'Бухгалтерия'),
        msgs: [
          { who: who.accountant, text: t('Ләззат оплатила остаток?', 'Ләззат қалған ақшасын төледі ме?') },
          { who: who.manager, text: t('Вроде наличными Дәулету отдала', 'Дәулетке қолма-қол берген сияқты'), side: 'in' },
          { who: who.accountant, text: t('«Вроде»?', '«Сияқты» ма?') },
        ],
      },
      { kind: 'pain', sec: 2.5, text: t('Деньги есть, но *никто точно не знает*, сколько', 'Ақша бар, бірақ қанша екенін *ешкім нақты білмейді*') },
      shot.dealProd(t('Заказ Ләззат: *оплачено 244 000, остаток 244 000*', 'Ләззаттың тапсырысы: *төленді 244 000, қалдық 244 000*'), 4.5),
      { kind: 'result', sec: 2.5, text: t('Предоплата и остаток *видны сразу*', 'Алдын ала төлем мен қалдық *бірден көрінеді*') },
      CTA,
    ],
  },
  {
    id: 'sit-lost-lead', badge: t('Ситуация', 'Жағдай'),
    scenes: [
      {
        kind: 'chat', sec: 4.5, title: t('Instagram · директ', 'Instagram · директ'),
        msgs: [
          { who: who.client, text: t('Здравствуйте, нужен замер на субботу', 'Сәлеметсіз бе, сенбіге өлшеу керек'), side: 'in' },
          { who: t('3 дня спустя', '3 күннен кейін'), text: t('Извините, что долго! На субботу записать?', 'Кешіріңіз! Сенбіге жазайық па?') },
          { who: who.client, text: t('Уже заказали в другом салоне', 'Басқа салоннан тапсырыс бердік'), side: 'in' },
        ],
      },
      { kind: 'pain', sec: 2.5, text: t('Клиент был *горячий*, пока про него не забыли', 'Клиент *дайын* еді, біз ұмытқанша') },
      shot.newOrder(t('Каждая заявка сразу *в системе*', 'Әр өтінім бірден *жүйеде*'), 3.5),
      shot.urgent(t('Система напоминает: *кого подтвердить*', 'Жүйе еске салады: *кімді растау керек*'), 4),
      { kind: 'result', sec: 2.5, text: t('Ни одна заявка *не остынет*', 'Бірде-бір өтінім *суымайды*') },
      CTA,
    ],
  },
];

export const CTA_TEXT = {
  ru: { title: 'Gardina: CRM для салонов штор', offer: '7 дней бесплатно на тарифе Pro', price: 'от 15 000 ₸ в месяц', site: 'gardina.kz', wa: 'WhatsApp +7 707 942 98 27' },
  kz: { title: 'Gardina: перде салондарына арналған CRM', offer: 'Pro тарифі 7 күн тегін', price: 'айына 15 000 ₸-ден', site: 'gardina.kz', wa: 'WhatsApp +7 707 942 98 27' },
};
