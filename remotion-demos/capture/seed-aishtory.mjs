// Demo salon "Айшторы" for promo videos. Local demo DB only (port 5433).
import { createRequire } from 'module';
const require = createRequire('/Users/nurdauletakhmatov/Projects/clients/gardina-biz/gardina-backend/package.json');
const pg = require('pg');
// Same estimate logic as the app (from the fix/measurement-estimate branch until it is merged).
const { calculateRoomEstimate, roomFromWindow } = await import(process.env.ESTIMATE_JS || '/Users/nurdauletakhmatov/Projects/clients/gardina-fix-estimate/gardina-frontend/src/utils/roomEstimate.js');

const db = new pg.Client({ host: 'localhost', port: 5433, user: 'gardina', password: 'demo_local_only', database: 'gardina_demo' });
await db.connect();
const q = (sql, args = []) => db.query(sql, args).then((r) => r.rows);

const [org] = await q(`SELECT id FROM organizations WHERE slug='aishtory'`);
const O = org.id;
// Keep the base team only (walkthrough "new employee" adds people on every take).
await q(`DELETE FROM users WHERE organization_id=$1 AND phone NOT IN ('+77012345601','+77012345602','+77012345603','+77012345604','+77012345605','+77012345606','+77012345607')`, [O]);
const users = Object.fromEntries((await q(`SELECT id, phone FROM users WHERE organization_id=$1`, [O])).map((u) => [u.phone, u.id]));
const U = {
  owner: users['+77012345601'], manager: users['+77012345602'], daulet: users['+77012345603'],
  asem: users['+77012345604'], sewer: users['+77012345605'], installer: users['+77012345606'], sales: users['+77012345607'],
};

const NOW = Date.now();
const at = (days, hour = 11, min = 0) => {
  const d = new Date(NOW + days * 86400000);
  d.setUTCHours(hour, min, 0, 0); // columns are timestamp without tz: store Almaty wall-clock time
  return d.toISOString();
};

await db.query('BEGIN');
for (const t of ['products', 'installations', 'orders', 'payments', 'deal_events', 'measurement_windows', 'proposals', 'deals', 'measurements', 'clients', 'fabrics']) {
  await q(`DELETE FROM ${t} WHERE organization_id=$1`.replace('measurement_windows WHERE organization_id=$1',
    'measurement_windows WHERE measurement_id IN (SELECT id FROM measurements WHERE organization_id=$1)'), [O]);
}

// Fabrics catalog
const fabrics = await q(`
  INSERT INTO fabrics (organization_id, code, name, type, price_per_meter, cost_price, width_cm, brand, supplier, is_available) VALUES
  ($1,'AB-101','Блэкаут «Антрацит»','blackout',4800,2900,280,'Arya Home','Турция',true),
  ($1,'AB-102','Блэкаут «Крем»','blackout',3600,2100,280,'Arya Home','Турция',true),
  ($1,'AV-201','Бархат «Изумруд»','decorative',6200,3800,300,'Mona Lisa','Турция',true),
  ($1,'AL-301','Лён «Песок»','semi_blackout',4100,2400,280,'Linen Line','Бельгия',true),
  ($1,'AT-401','Тюль вуаль «Молоко»','transparent',1400,700,300,'Vual','Китай',true),
  ($1,'AT-402','Тюль сетка «Лён»','transparent',2100,1100,300,'Vual','Турция',true),
  ($1,'AR-501','Римская «Графит»','semi_blackout',4500,2700,240,'Arya Home','Турция',true),
  ($1,'AZ-601','Зебра «Белый/серый»','semi_blackout',3200,1800,250,'Zebra Pro','Россия',true)
  RETURNING id, code, price_per_meter`, [O]);
const F = Object.fromEntries(fabrics.map((f) => [f.code, f]));
const FABRIC_NAMES = { 'AB-101': 'Блэкаут «Антрацит»', 'AB-102': 'Блэкаут «Крем»', 'AV-201': 'Бархат «Изумруд»', 'AL-301': 'Лён «Песок»' };

// Catalog shown in the app (products table)
await q(`INSERT INTO products (organization_id, code, name, type, category, price_per_meter, cost_price, width_cm, brand, supplier, unit, is_available) VALUES
  ($1,'AB-101','Блэкаут «Антрацит»','curtain','blackout',4800,2900,280,'Arya Home','Турция','m',true),
  ($1,'AB-102','Блэкаут «Крем»','curtain','blackout',3600,2100,280,'Arya Home','Турция','m',true),
  ($1,'AV-201','Бархат «Изумруд»','curtain','fabric',6200,3800,300,'Mona Lisa','Турция','m',true),
  ($1,'AL-301','Лён «Песок»','curtain','fabric',4100,2400,280,'Linen Line','Бельгия','m',true),
  ($1,'AT-401','Тюль вуаль «Молоко»','tulle','tulle',1400,700,300,'Vual','Китай','m',true),
  ($1,'AT-402','Тюль сетка «Лён»','tulle','tulle',2100,1100,300,'Vual','Турция','m',true),
  ($1,'AK-701','Карниз потолочный 3-ряд','cornice','cornice',5500,3200,null,'Gardinia','Россия','m',true),
  ($1,'AZ-601','Жалюзи «Зебра» белый/серый','jalousie','jalousie',3200,1800,250,'Zebra Pro','Россия','m',true),
  ($1,'SV-001','Пошив штор','service','service',1500,0,null,'','','m',true),
  ($1,'SV-002','Монтаж карниза','service','service',2500,0,null,'','','m',true)`, [O]);
await q(`UPDATE users SET email_verified_at=now() WHERE organization_id=$1`, [O]);

// Clients
const C = [
  ['Айжан Бекмұратова', '+77051112201', 'Алматы, ЖК «Esentai City», кв. 84', 'instagram', 'Гостиная и спальня, любит светлые тона'],
  ['Руслан Оспанов', '+77051112202', 'Алматы, мкр. Керемет, 7, кв. 31', 'whatsapp', 'Кабинет, нужен полный блэкаут'],
  ['Жанна Серікбаева', '+77051112203', 'Астана, ЖК «Highvill», блок C, кв. 45', 'referral', 'Порекомендовала Айжан'],
  ['Данияр Құрманов', '+77051112204', 'Алматы, ул. Жандосова, 58, кв. 12', '2gis', 'Детская, спешит к 1 октября'],
  ['Ләззат Әбдірова', '+77051112205', 'Шымкент, мкр. Нурсат, 112, кв. 9', 'instagram', 'Весь дом, 6 окон'],
  ['Ольга Ким', '+77051112206', 'Алматы, пр. Аль-Фараби, 77/8, кв. 102', 'threads', 'Пришла из Threads'],
  ['Нұрсұлтан Жақыпов', '+77051112207', 'Астана, ул. Кабанбай батыра, 11, кв. 230', 'whatsapp', 'Офис, 8 окон, жалюзи'],
  ['Меруерт Сәтбаева', '+77051112208', 'Алматы, мкр. Самал-2, 33, кв. 17', 'instagram', 'Зал, бархат'],
  ['Асель Тұрсынова', '+77051112209', 'Алматы, ЖК «Alma City», кв. 56', 'referral', 'Спальня'],
  ['Тимур Ахметов', '+77051112210', 'Астана, ЖК «Nurly Zhol», кв. 34', '2gis', 'Гостиная, римские шторы'],
  ['Гаухар Мұхтарқызы', '+77051112211', 'Алматы, ул. Розыбакиева, 247, кв. 70', 'instagram', 'VIP, пентхаус, потолки 3,4 м'],
  ['Сергей Павлов', '+77051112212', 'Алматы, мкр. Орбита-3, 12, кв. 5', 'website', ''],
  ['Айгерім Нұрланова', '+77051112213', 'Шымкент, ул. Байтурсынова, 40', 'whatsapp', 'Кухня и зал'],
  ['Ерболат Сейітов', '+77051112214', 'Алматы, ул. Тимирязева, 28, кв. 3', 'instagram', 'Спальня'],
  ['Диана Қасымова', '+77051112215', 'Астана, пр. Мангилик Ел, 55, кв. 118', 'threads', 'Гостиная'],
  ['Мадияр Әлиев', '+77051112216', 'Алматы, ЖК «Премьера», кв. 204', 'referral', 'Зал, 2 окна'],
  ['Камила Идрисова', '+77051112217', 'Алматы, ул. Абая, 150, кв. 41', 'instagram', 'Новая заявка из директа'],
  ['Бекзат Омаров', '+77051112218', 'Астана, ЖК «Триумф Астаны», кв. 201', 'whatsapp', 'Хочет замер на выходных'],
];
const clients = [];
for (const [name, phone, address, source, notes] of C) {
  const [c] = await q(`INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
    VALUES ($1,$2,$3,$3,$4,$5,$6,$7) RETURNING id, name, address`, [O, name, phone, address, source, notes, U.manager]);
  clients.push(c);
}

// Deals: [client idx, status, designer, total, paidShare, measureDay, deadlineDay, windows]
const W = {
  big: [['Зал', 1, 320, 280], ['Зал', 2, 180, 280], ['Спальня', 1, 240, 265]],
  two: [['Гостиная', 1, 300, 270], ['Гостиная', 2, 300, 270]],
  one: [['Спальня', 1, 260, 270]],
  kid: [['Детская', 1, 210, 260]],
  office: [['Офис', 1, 180, 150], ['Офис', 2, 180, 150], ['Офис', 3, 180, 150], ['Переговорная', 1, 240, 150]],
  vip: [['Зал', 1, 420, 340], ['Зал', 2, 420, 340], ['Спальня', 1, 300, 300], ['Кабинет', 1, 220, 300]],
};
const D = [
  [16, 'lead', U.asem, 0, 0, null, 14, null],
  [17, 'lead', U.daulet, 0, 0, null, 18, null],
  [5, 'lead', U.asem, 0, 0, null, 20, null],
  [13, 'measurement_scheduled', U.daulet, 0, 0, 1, 16, null],
  [14, 'measurement_scheduled', U.asem, 0, 0, 2, 17, null],
  [9, 'measurement_scheduled', U.daulet, 0, 0, 3, 21, null],
  [1, 'measurement_done', U.daulet, 186000, 0, -2, 12, 'one'],
  [11, 'proposal_sent', U.asem, 142000, 0, -4, 11, 'one'],
  [7, 'proposal_sent', U.daulet, 264000, 0, -5, 13, 'two'],
  [8, 'proposal_accepted', U.asem, 158000, 0, -6, 10, 'one'],
  [3, 'contract_signed', U.daulet, 118000, 0.5, -8, 3, 'kid'],
  [2, 'in_production', U.asem, 342000, 0.5, -12, 6, 'big'],
  [6, 'in_production', U.daulet, 296000, 0.5, -11, 8, 'office'],
  [4, 'in_production', U.asem, 488000, 0.5, -14, 7, 'big'],
  [0, 'ready_for_installation', U.daulet, 356000, 0.5, -18, 2, 'big'],
  [10, 'installation_scheduled', U.asem, 784000, 0.5, -21, 1, 'vip'],
  [12, 'completed', U.daulet, 212000, 1, -30, -9, 'two'],
  [15, 'completed', U.asem, 176000, 1, -40, -20, 'two'],
];
const payStatus = (s) => (s >= 1 ? 'paid' : s > 0 ? 'partial' : 'pending');
const orderStatus = { in_production: ['cutting', 'sewing', 'quality_check'], ready_for_installation: ['ready'], installation_scheduled: ['ready'], completed: ['shipped'] };
let prodIdx = 0;

for (const [ci, status, designer, total0, share, mDay, dlDay, win] of D) {
  const cl = clients[ci];
  let total = total0;
  const fabCode = win === 'office' ? 'AL-301' : win === 'vip' ? 'AV-201' : win === 'kid' ? 'AB-102' : 'AB-101';
  let mId = null;
  if (mDay !== null) {
    const done = mDay < 0;
    const [m] = await q(`INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,started_at,completed_at,address,room_type,budget_min,budget_max,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [O, cl.id, designer, done ? 'completed' : 'scheduled', at(mDay, 11 + (ci % 6)), done ? at(mDay, 11 + (ci % 6)) : null,
        done ? at(mDay, 12 + (ci % 6)) : null, cl.address, win ? W[win].map((w) => w[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ') : 'Гостиная',
        Math.round(total * 0.8) || 100000, Math.round(total * 1.2) || 250000, '']);
    mId = m.id;
    if (win) {
      let estimate = 0;
      for (const [room, n, w, h] of W[win]) {
        const pb = { solutionType: 'classic', sewingRate: 1700, installationRate: 1500, tape: { rollId: 'tape_50m' }, hooks: { type: 'plastic' },
          fabricItems: [{ fabricCode: fabCode, fabricName: FABRIC_NAMES[fabCode], fabricType: 'curtain', pricePerMeter: Number(F[fabCode].price_per_meter) }] };
        estimate += calculateRoomEstimate(roomFromWindow({ roomName: room, dimensions: { width: w * 10, height: h * 10 }, priceBreakdown: pb })).total;
        await q(`INSERT INTO measurement_windows (measurement_id,window_number,room_name,width_left,width_center,width_right,height_left,height_center,height_right,mounting_type,notes,fabric_code,price_breakdown)
          VALUES ($1,$2,$3,$4,$4,$4,$5,$6,$5,'ceiling','',$7,$8)`, [mId, n, room, w * 10, h * 10, h * 10 - 10, fabCode, JSON.stringify(pb)]);
      }
      total = Math.round(estimate);
    }
  }
  const prepay = Math.round(total * Math.min(share, 0.5));
  const [d] = await q(`INSERT INTO deals (organization_id,client_id,designer_id,manager_id,measurement_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,deadline,created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,50,$9,$10,$11,$12) RETURNING id`,
    [O, cl.id, designer, U.manager, mId, status, total, share > 0 ? prepay : 0, share >= 1 ? total - prepay : 0, payStatus(share), at(dlDay, 18), at((mDay ?? 0) - 1, 10)]);
  if (mId) await q(`UPDATE measurements SET deal_id=$1 WHERE id=$2`, [d.id, mId]);

  if (total > 0) {
    const fab = win === 'office' ? F['AZ-601'] : win === 'vip' ? F['AV-201'] : win === 'kid' ? F['AB-102'] : F['AB-101'];
    const meters = Math.round(total / fab.price_per_meter / 1.9);
    await q(`INSERT INTO proposals (organization_id,measurement_id,client_id,designer_id,variant_name,fabric_id,fabric_meters,fabric_cost,sewing_cost,installation_cost,total_cost,status,sent_at)
      VALUES ($1,$2,$3,$4,'Основной вариант',$5,$6,$7,$8,$9,$10,$11,$12)`,
      [O, mId, cl.id, designer, fab.id, meters, meters * fab.price_per_meter, Math.round(total * 0.28), Math.round(total * 0.1), total,
        status === 'proposal_sent' ? 'sent' : status === 'measurement_done' ? 'draft' : 'accepted', at((mDay ?? 0) + 1, 15)]);
  }
  if (share > 0) {
    await q(`INSERT INTO payments (organization_id,deal_id,measurement_id,type,amount,payment_method,paid_at,note,created_by) VALUES ($1,$2,$6,'prepayment',$3,'online',$4,'Предоплата 50%, Kaspi',$5)`,
      [O, d.id, prepay, at(mDay + 1, 16), U.manager, mId]);
    if (share >= 1) await q(`INSERT INTO payments (organization_id,deal_id,measurement_id,type,amount,payment_method,paid_at,note,created_by) VALUES ($1,$2,$6,'final',$3,'cash',$4,'Остаток после монтажа',$5)`,
      [O, d.id, total - prepay, at(dlDay, 17), U.manager, mId]);
  }
  if (orderStatus[status]) {
    const list = orderStatus[status];
    const os = list[status === 'in_production' ? prodIdx++ % list.length : 0];
    const [o] = await q(`INSERT INTO orders (organization_id,deal_id,status,assigned_to,started_at,estimated_completion) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [O, d.id, os, U.sewer, at(mDay + 3, 9), at(dlDay - 1, 18)]);
    if (status === 'installation_scheduled' || status === 'completed') {
      await q(`INSERT INTO installations (organization_id,deal_id,order_id,installer_id,status,scheduled_at,completed_at,address,client_phone,client_contact_name,client_rating)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [O, d.id, o.id, U.installer, status === 'completed' ? 'completed' : 'scheduled', at(dlDay, 10), status === 'completed' ? at(dlDay, 13) : null,
          cl.address, C[ci][1], cl.name, status === 'completed' ? 5 : null]);
    }
  }
  const ev = [['created', 'Заявка принята'], ...(mId ? [['measurement', 'Замер назначен']] : []), ...(total ? [['proposal', 'КП отправлено клиенту']] : []),
    ...(share > 0 ? [['payment', `Получена предоплата ${prepay.toLocaleString('ru-RU')} ₸`]] : [])];
  for (const [type, desc] of ev) await q(`INSERT INTO deal_events (organization_id,deal_id,event_type,description,created_by) VALUES ($1,$2,$3,$4,$5)`, [O, d.id, type, desc, U.manager]);
}

await db.query('COMMIT');
const counts = await q(`SELECT (SELECT count(*) FROM clients WHERE organization_id=$1) clients, (SELECT count(*) FROM deals WHERE organization_id=$1) deals,
  (SELECT count(*) FROM measurements WHERE organization_id=$1) measurements, (SELECT count(*) FROM orders WHERE organization_id=$1) orders,
  (SELECT count(*) FROM payments WHERE organization_id=$1) payments, (SELECT sum(total_amount) FROM deals WHERE organization_id=$1) revenue`, [O]);
console.log(counts[0]);
await db.end();
