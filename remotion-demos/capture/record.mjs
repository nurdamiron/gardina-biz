// Screen-records real Gardina flows on the demo salon «Айшторы» for walkthrough videos.
// usage: node record.mjs <flow> <ru|kz> [baseUrl]
// Output: out/walkthrough/<flow>-<lang>.webm + <flow>-<lang>.json (step timestamps for captions/voice).
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const req = createRequire(import.meta.url);
let playwright;
try { playwright = req('playwright'); } catch { playwright = createRequire(process.env.HOME + '/threads-marketing/scripts/package.json')('playwright'); }
const { chromium } = playwright;

const EXE = process.env.HOME + '/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const [flowName, lang = 'ru', BASE = 'http://localhost:5175'] = process.argv.slice(2);
const PW = fs.readFileSync(new URL('./.demo-password', import.meta.url), 'utf8').trim();
const OUT = path.resolve(new URL('.', import.meta.url).pathname, '../out/walkthrough');
fs.mkdirSync(OUT, { recursive: true });

const PHONES = { owner: '+77012345601', manager: '+77012345602', designer: '+77012345603' };
const L = (ru, kz) => (lang === 'kz' ? kz : ru);

// Visible touch indicator + no text caret blink noise.
const TOUCH_JS = `
(() => {
  const add = () => {
    if (document.getElementById('__touch_style')) return;
    const st = document.createElement('style'); st.id = '__touch_style';
    st.textContent = '.__tap{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(27,94,69,.35);border:3px solid rgba(27,94,69,.9);pointer-events:none;z-index:2147483647;animation:__tap .55s ease-out forwards}@keyframes __tap{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.4);opacity:0}}';
    document.head.appendChild(st);
  };
  window.addEventListener('pointerdown', (e) => {
    add();
    const d = document.createElement('div'); d.className = '__tap';
    d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 700);
  }, true);
})();`;

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({
  viewport: { width: 430, height: 932 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  locale: lang === 'kz' ? 'kk-KZ' : 'ru-RU', timezoneId: 'Asia/Almaty',
});
await ctx.addInitScript(TOUCH_JS);
await ctx.addInitScript(() => { window.open = (u) => { window.__opened = u; return null; }; });
const TOKENS = JSON.parse(fs.readFileSync(new URL('./.tokens.json', import.meta.url), 'utf8'));
const page = await ctx.newPage();
const t0 = Date.now();
// High-res capture: Chrome screencast frames at device pixels (430x932 @2x = 860x1864).
const frames = [];
const cdp = await ctx.newCDPSession(page);
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  frames.push({ data, ts: metadata.timestamp });
  try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 860, maxHeight: 1864, everyNthFrame: 1 });
const steps = [];
const mark = (ru, kz) => steps.push({ t: (Date.now() - t0) / 1000, ru, kz });
let startAt = 0;
const pause = (ms) => page.waitForTimeout(ms);

async function tap(locator, wait = 700) {
  // Center the target: sticky bottom bars (Save, nav) cover elements scrolled to the edge.
  const inView = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top > 90 && r.bottom < window.innerHeight - 130;
  }).catch(() => true);
  if (!inView) {
    await locator.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => {});
    await pause(650);
  }
  await pause(250);
  const box = await locator.boundingBox();
  if (box) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  else await locator.click();
  await pause(wait);
}
async function type(locator, text) {
  await tap(locator, 200);
  await locator.pressSequentially(text, { delay: 55 });
  await pause(350);
}
async function dismissPrompts() {
  const later = page.getByRole('button', { name: /^(Позже|Кейін)$/ });
  if (await later.count()) { await later.first().click(); await pause(400); }
}
async function smoothScroll(dy, ms = 900) {
  const steps_ = 18;
  for (let i = 0; i < steps_; i++) { await page.mouse.wheel(0, dy / steps_); await pause(ms / steps_); }
}

async function login(role) {
  const { accessToken, refreshToken } = TOKENS[role];
  await ctx.addInitScript(([at, rt, lg]) => {
    localStorage.setItem('accessToken', at);
    if (rt) localStorage.setItem('refreshToken', rt);
    localStorage.setItem('gardina_lang', lg);
  }, [accessToken, refreshToken, lang]);
  const home = { owner: '/admin/dashboard', manager: '/manager/dashboard', designer: '/designer/dashboard' }[role];
  await page.goto(BASE + home);
  await pause(2500);
  await dismissPrompts();
  await pause(1500); await dismissPrompts();
}

const FLOWS = {
  // 1. Потерянная заявка → менеджер принимает заявку за минуту
  async lead() {
    await login('manager');
    startAt = (Date.now() - t0) / 1000;
    mark('Менеджер открывает Gardina', 'Менеджер Gardina-ны ашады');
    await pause(1800);
    mark('Новая заявка: «Создать новый заказ»', 'Жаңа өтінім: «Жаңа тапсырыс құру»');
    await tap(page.getByRole('button', { name: /Создать новый заказ|Жаңа тапсырыс/ }).first(), 1500);
    await dismissPrompts();
    await page.evaluate(() => window.scrollTo(0, 0)); await pause(500);
    mark('Имя, телефон и адрес клиента', 'Клиенттің аты, телефоны, мекенжайы');
    await type(page.getByPlaceholder(/Поиск или новое имя|Іздеу немесе жаңа/), 'Сәуле Нұрбекова');
    await type(page.getByPlaceholder('+7 777 000 00 00'), '+77051112230');
    await type(page.getByPlaceholder(/Улица, дом|Көше/), 'Алматы, мкр. Самал-1, 12, кв. 45');
    mark('Какие комнаты: гостиная и спальня', 'Қай бөлмелер: қонақ бөлме мен жатын бөлме');
    await tap(page.getByText(L('Гостиная', 'Қонақ бөлме'), { exact: true }), 500);
    await tap(page.getByText(L('Спальня', 'Жатын бөлме'), { exact: true }), 700);
    mark('Назначаем замерщика', 'Өлшеушіні тағайындаймыз');
    await tap(page.getByText('Дәулет Қасымов', { exact: true }), 900);
    mark('«Создать» — заявка в системе', '«Құру» — өтінім жүйеде');
    await tap(page.getByRole('button', { name: /^(Создать|Құру)/ }), 2600);
    mark('Заявка в списке, замерщик уже её видит', 'Өтінім тізімде, өлшеуші оны көріп тұр');
    await pause(1200);
    await page.getByText('Сәуле Нұрбекова').first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await pause(3000);
  },

  // 2. Не тот размер → замерщик вносит размеры, ткань и отправляет смету
  async measure() {
    await login('designer');
    startAt = (Date.now() - t0) / 1000;
    mark('Замерщик открывает свои замеры', 'Өлшеуші өз өлшемдерін ашады');
    await pause(1200);
    await tap(page.getByRole('button', { name: /^(Замеры|Өлшемдер)$/ }).last(), 1500);
    mark('Адрес и время уже в карточке. «Начать»', 'Мекенжай мен уақыт картада. «Бастау»');
    const card = page.locator('div').filter({ hasText: 'Ерболат Сейітов' }).filter({ has: page.getByRole('button', { name: /^(Начать|Бастау)$/ }) }).last();
    await pause(1200);
    await tap(card.getByRole('button', { name: /^(Начать|Бастау)$/ }), 1800);
    mark('Добавляем помещение: спальня', 'Бөлме қосамыз: жатын бөлме');
    await tap(page.getByRole('button', { name: /Добавить помещение|Бөлме қосу/ }).first(), 1500);
    await dismissPrompts();
    await tap(page.getByRole('button', { name: L('Спальня', 'Жатын бөлме') }).first(), 1300);
    await dismissPrompts();
    mark('Что ставим и какие размеры', 'Не орнатамыз және өлшемдер');
    await tap(page.getByRole('button', { name: /Классические шторы|Классикалық перде/ }), 700);
    await type(page.locator('input[type=number]').nth(0), '3.2');
    await type(page.locator('input[type=number]').nth(1), '2.7');
    mark('Ткань из каталога салона', 'Салон каталогынан мата');
    await tap(page.getByRole('button', { name: /\+ (Добавить ткань|Мата қосу)/ }), 900);
    await type(page.getByPlaceholder(/Поиск ткани|Мата іздеу/), 'Блэк');
    await pause(700);
    await tap(page.getByText('Блэкаут «Антрацит»').first(), 600);
    await tap(page.locator('div.fixed.inset-0').getByRole('button', { name: /Добавить|Қосу/ }), 1200);
    mark('Смета считается сама: ткань, пошив, лента, установка', 'Смета өзі есептеледі: мата, тігу, таспа, орнату');
    await smoothScroll(1500, 2200);
    await pause(1500);
    await tap(page.getByRole('button', { name: /^(Сохранить|Сақтау)/ }).last(), 1800);
    mark('Готовая смета для клиента', 'Клиентке дайын смета');
    await tap(page.getByRole('button', { name: /Смотреть смету|Сметаны көру/ }), 1600);
    await smoothScroll(700, 1400); await pause(1200);
    mark('Одна кнопка: смета уходит клиенту в WhatsApp', 'Бір батырма: смета клиенттің WhatsApp-ына кетеді');
    await tap(page.getByRole('button', { name: 'WhatsApp' }), 2200);
    mark('Замер завершён, менеджер всё видит', 'Өлшем аяқталды, менеджер бәрін көреді');
    await tap(page.getByRole('button', { name: /^(Завершить|Аяқтау)$/ }).first(), 900);
    await tap(page.getByRole('button', { name: /^(Завершить|Аяқтау)$/ }).last(), 2500);
    await pause(1500);
  },

  // 3. Кто взял предоплату → менеджер вносит оплату
  async payment() {
    await login('manager');
    startAt = (Date.now() - t0) / 1000;
    mark('Клиент перевёл предоплату. Открываем заказ', 'Клиент алдын ала төледі. Тапсырысты ашамыз');
    await tap(page.getByRole('button', { name: /^(Заказы|Тапсырыс)$/ }).last(), 1800);
    await tap(page.getByText('Ерболат Сейітов').filter({ visible: true }).first(), 1800);
    mark('Сумма по смете уже в заказе', 'Смета сомасы тапсырыста тұр');
    await pause(1600);
    await tap(page.getByRole('button', { name: /Открыть замер|Өлшемді ашу/ }), 600);
    const url = await page.evaluate(() => window.__opened);
    if (url) await page.goto(new URL(url, BASE).href);
    await pause(2200); await dismissPrompts();
    const payBtn = page.getByRole('button', { name: /Добавить платёж|Добавить оплату|Төлем қосу/ }).last();
    await payBtn.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await pause(1300);
    mark('«Добавить платёж»: сумма и способ', '«Төлем қосу»: сома және тәсіл');
    await tap(payBtn, 1000);
    await type(page.getByPlaceholder(/^(Сумма|Сома)$/), '30000');
    await type(page.getByPlaceholder(/Примечание|Ескерту/), 'Kaspi перевод');
    await tap(page.getByRole('button', { name: /^(Сохранить|Сақтау)$/ }).last(), 2200);
    mark('Видно, сколько оплачено и сколько осталось', 'Қанша төленгені, қанша қалғаны көрінеді');
    await page.getByText(/Оплачено|Төленді/).first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' })).catch(() => {});
    await pause(3500);
  },

  // 4. Где мой заказ → менеджер находит заказ за секунды
  async whereorder() {
    await login('manager');
    startAt = (Date.now() - t0) / 1000;
    mark('Клиентка спрашивает: где мой заказ?', 'Клиент сұрайды: тапсырысым қайда?');
    await pause(1500);
    await tap(page.getByRole('button', { name: /^(Заказы|Тапсырыс)$/ }).last(), 1600);
    mark('Фильтр по этапу: «Готов»', 'Кезең бойынша сүзгі: «Дайын»');
    await tap(page.locator('select').first(), 500);
    await page.locator('select').first().selectOption('ready_for_installation');
    await pause(1500);
    mark('Открываем заказ Айжан', 'Айжанның тапсырысын ашамыз');
    await tap(page.getByText('Айжан Бекмұратова').filter({ visible: true }).first(), 1800);
    mark('Готов к монтажу, оплачено и остаток', 'Монтажға дайын, төленгені мен қалдығы');
    await pause(2200);
    mark('Вся история заказа', 'Тапсырыстың бүкіл тарихы');
    const modal = page.locator('div.fixed').last();
    await modal.locator('text=/История заказа|Тапсырыс тарихы/').first().evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    await pause(3500);
  },

  // 5. Менеджер заболел → владелец находит клиента сам
  async client() {
    await login('owner');
    startAt = (Date.now() - t0) / 1000;
    mark('Менеджер на больничном. Владелец открывает клиентов', 'Менеджер ауырып қалды. Иесі клиенттерді ашады');
    await pause(1300);
    await tap(page.getByRole('button', { name: /^(Клиенты|Клиенттер)$/ }).last(), 1600);
    mark('Поиск по имени', 'Аты бойынша іздеу');
    await type(page.getByPlaceholder(/Поиск клиентов|Клиент іздеу/), 'Айжан');
    await pause(900);
    mark('Карточка: телефон, WhatsApp, замеры', 'Карта: телефон, WhatsApp, өлшемдер');
    await tap(page.getByText('Айжан Бекмұратова').filter({ visible: true }).first(), 2000);
    await pause(1800);
    mark('Все сделки клиента в одном месте', 'Клиенттің барлық мәмілесі бір жерде');
    await tap(page.getByRole('button', { name: /^(Сделки|Мәмілелер)$/ }).first(), 1800).catch(() => {});
    await pause(2600);
  },

  // 6. Утро владельца
  async morning() {
    await login('owner');
    startAt = (Date.now() - t0) / 1000;
    mark('Утро владельца: все цифры на одном экране', 'Иесінің таңы: барлық цифр бір экранда');
    await pause(2500);
    mark('Финансы: выручка и оплаты', 'Қаржы: табыс пен төлемдер');
    await tap(page.getByRole('button', { name: /^(Финансы|Қаржы)$/ }).first(), 2600);
    await smoothScroll(900, 1800); await pause(1500);
    mark('Команда: кто сколько сделал', 'Команда: кім қанша жасады');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await pause(700);
    await tap(page.getByRole('button', { name: /^(Команда)$/ }).first(), 2600);
    await smoothScroll(700, 1500); await pause(2000);
  },

  // 7. Новый сотрудник
  async staff() {
    await login('owner');
    await page.goto(BASE + '/admin/users'); await pause(1800); await dismissPrompts();
    startAt = (Date.now() - t0) / 1000;
    mark('Новый сотрудник за минуту', 'Жаңа қызметкер бір минутта');
    await pause(1500);
    await tap(page.locator('button.bg-primary.text-white').filter({ has: page.locator('svg') }).first(), 1200);
    mark('Имя, логин и пароль', 'Аты, логин және құпия сөз');
    await type(page.getByPlaceholder(/Полное имя|Толық аты|ФИО/), 'Жанар Сапарова');
    await type(page.getByPlaceholder(/akbota/), '+77012345610');
    await type(page.getByPlaceholder(/6 /), 'Aishtory2026');
    mark('Роль: замерщик-дизайнер', 'Рөлі: өлшеуші-дизайнер');
    await tap(page.locator('div.fixed').last().getByRole('button', { name: /^Дизайнер$/ }).first(), 900).catch(() => {});
    mark('Готово: сотрудник входит со своего телефона', 'Дайын: қызметкер өз телефонынан кіреді');
    await tap(page.locator('div.fixed').last().getByRole('button', { name: /^(Создать|Жасау)$/ }).last(), 2500);
    await pause(2000);
  },
};

if (!FLOWS[flowName]) { console.error('flows:', Object.keys(FLOWS).join(', ')); process.exit(1); }
try {
  await FLOWS[flowName]();
} finally {
  await cdp.send('Page.stopScreencast').catch(() => {});
  await ctx.close();
  const tmp = fs.mkdtempSync(path.join(OUT, '.frames-'));
  const first = frames[0]?.ts ?? t0 / 1000;
  const lines = [];
  frames.forEach((f, i) => {
    const file = path.join(tmp, `${String(i).padStart(5, '0')}.jpg`);
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    const next = frames[i + 1]?.ts ?? f.ts + 1.5;
    lines.push(`file '${file}'`, `duration ${Math.max(0.001, next - f.ts).toFixed(4)}`);
  });
  lines.push(`file '${path.join(tmp, String(frames.length - 1).padStart(5, '0') + '.jpg')}'`);
  fs.writeFileSync(path.join(tmp, 'list.txt'), lines.join('\n'));
  const dst = path.join(OUT, `${flowName}-${lang}.mp4`);
  const { execFileSync } = await import('child_process');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'),
    '-vf', 'scale=860:1864:force_original_aspect_ratio=decrease,pad=860:1864:(ow-iw)/2:0:white,fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', dst]);
  fs.rmSync(tmp, { recursive: true, force: true });
  // step times relative to the first captured frame
  const rel = (t) => t - (first - t0 / 1000);
  fs.writeFileSync(path.join(OUT, `${flowName}-${lang}.json`), JSON.stringify({
    flow: flowName, lang, startAt: rel(startAt), end: frames.length ? frames[frames.length - 1].ts - first + 1.5 : 0,
    steps: steps.map((st) => ({ ...st, t: rel(st.t) })),
  }, null, 1));
  await browser.close();
  console.log('saved', dst, 'frames', frames.length, 'steps', steps.length);
}
