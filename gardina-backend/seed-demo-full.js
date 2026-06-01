/**
 * Full demo seed — realistic Kazakh curtain business data
 * Run: node seed-demo-full.js
 */

import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: `postgresql://gardina_app:Gardina%23Prod2026%21@projects.cde42ec8m1u7.eu-north-1.rds.amazonaws.com:5432/gardina_prod?sslmode=require`,
});

const ORG_ID = 'b35e3efc-cedf-414d-8386-f6d7913a04c5';
const ADMIN_ID = 'c19a9783-1d34-4e95-ad6c-8d4c8c6d6bd3';
const DEMO_PASSWORD = 'Demo1234!';

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // ── 1. Сотрудники ──────────────────────────────────────────────────────────
    console.log('Creating staff...');

    const staff = await client.query(`
      INSERT INTO users (organization_id, name, phone, email, password_hash, role, is_active)
      VALUES
        ($1, 'Айгерім Сейіткали',  '+77071112233', 'aigerim@gardina.demo',  $2, 'manager',  true),
        ($1, 'Дәмір Жақсыбеков',   '+77072223344', 'damir@gardina.demo',    $2, 'designer', true),
        ($1, 'Аружан Нұрланова',   '+77073334455', 'aruzhan@gardina.demo',  $2, 'designer', true),
        ($1, 'Ерлан Бекенов',      '+77074445566', 'erlan@gardina.demo',    $2, 'sales',    true)
      ON CONFLICT (organization_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, role
    `, [ORG_ID, hash]);

    const [manager, designer1, designer2, sales] = staff.rows;
    console.log('  Staff:', staff.rows.map(u => `${u.name} (${u.role})`).join(', '));

    // ── 2. Каталог тканей ──────────────────────────────────────────────────────
    console.log('Creating fabrics...');

    const fabrics = await client.query(`
      INSERT INTO fabrics (organization_id, name, type, color, price_per_meter, cost_price, width_cm, brand, is_active)
      VALUES
        ($1, 'Блэкаут Премиум',   'blackout',  'Антрацит',     4500, 2800, 280, 'Arya',     true),
        ($1, 'Блэкаут Класик',    'blackout',  'Кремовый',     3200, 1900, 280, 'Arya',     true),
        ($1, 'Портьера Бархат',   'curtain',   'Изумруд',      5800, 3500, 300, 'Mona Lisa',true),
        ($1, 'Портьера Лён',      'curtain',   'Бежевый',      3900, 2300, 280, 'Турция',   true),
        ($1, 'Тюль Вуаль',        'tulle',     'Белый',        1200,  650, 300, 'Турция',   true),
        ($1, 'Тюль Органза',      'tulle',     'Молочный',     1800,  950, 300, 'Китай',    true),
        ($1, 'Рим. штора Лён',    'roman',     'Серый',        4200, 2600, 240, 'Бельгия',  true),
        ($1, 'Жалюзи Зебра',      'zebra',     'Белый/Серый',  2800, 1600, 250, 'Россия',   true)
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `, [ORG_ID]);

    const [blackout1, blackout2, velvet, linen, tulle1, tulle2, roman, zebra] = fabrics.rows;
    console.log('  Fabrics:', fabrics.rows.map(f => f.name).join(', '));

    // ── 3. Клиенты ─────────────────────────────────────────────────────────────
    console.log('Creating clients...');

    const clients = await client.query(`
      INSERT INTO clients (organization_id, name, phone, whatsapp, address, source, notes, created_by)
      VALUES
        ($1,'Айгүл Сейітова',     '+77011234567','+77011234567','Алматы, ул. Абая, 45/3, кв.12',  'instagram', 'Постоянный клиент, любит нейтральные тона',  $2),
        ($1,'Марат Жақсыбеков',   '+77012345678','+77012345678','Алматы, мкр. Алатау, 23, кв.5',  'instagram', 'Новый клиент',                               $2),
        ($1,'Дина Нұрланова',     '+77013456789','+77013456789','Астана, ул. Достык, 112, кв.88',  'whatsapp',  'VIP, квартира 180 кв.м., бюджет до 800k',    $2),
        ($1,'Самал Ахметова',     '+77014567890','+77014567890','Алматы, ул. Тауелсіздік, 8',      'referral',  'Порекомендовала Айгуль Сейтова',             $2),
        ($1,'Бауыржан Ержанов',   '+77015678901','+77015678901','Алматы, пр. Достык, 200, кв.3',   'website',   'Офис, нужны жалюзи на 8 окон',               $2),
        ($1,'Гүлнар Қасымова',    '+77016789012','+77016789012','Астана, ЖК «Нурлы жол», кв.34',   'instagram', 'Детская и гостиная',                          $2),
        ($1,'Арман Сейткали',     '+77017890123','+77017890123','Алматы, мкр. Самал-2, 45, кв.7',  'whatsapp',  'Переделывает ремонт',                         $2),
        ($1,'Жанар Бекова',       '+77018901234','+77018901234','Алматы, ул. Панфилова, 99, кв.2', 'referral',  'Нужны шторы к 15 июня — горит дедлайн',      $2),
        ($1,'Нұрбол Алиев',       '+77019012345','+77019012345','Астана, ЖК «Триумф», кв.201',     'instagram', 'Пентхаус, потолки 3.5м',                      $2),
        ($1,'Зарина Мусаева',     '+77010123456','+77010123456','Алматы, ул. Розыбакиева, 10',     'website',   'Спальня и зал',                               $2)
      ON CONFLICT (organization_id, phone) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name
    `, [ORG_ID, manager.id]);

    const [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10] = clients.rows;
    console.log('  Clients:', clients.rows.map(c => c.name).join(', '));

    // ── 4. Замеры ──────────────────────────────────────────────────────────────
    console.log('Creating measurements...');

    const now = new Date();
    const daysAgo = (n) => new Date(now - n * 86400000);
    const daysLater = (n) => new Date(+now + n * 86400000);

    const meas = await client.query(`
      INSERT INTO measurements (organization_id, client_id, designer_id, status, scheduled_at, started_at, completed_at, address, room_type, budget_min, budget_max, notes)
      VALUES
        ($1,$2,$3,'completed', $4,$5,$6,'Алматы, ул. Абая, 45/3',       'Зал + спальня',    150000,300000,'Клиент доволен, замер прошёл отлично'),
        ($1,$7,$3,'completed', $8,$9,$10,'Алматы, мкр. Алатау, 23',     'Гостиная',          80000,150000,'2 окна в зале'),
        ($1,$11,$12,'completed',$13,$14,$15,'Астана, ул. Достык, 112',  'Весь дом 5 комнат',400000,800000,'VIP клиент, нужны образцы тканей'),
        ($1,$16,$3,'in_progress',$17,$18,NULL,'Алматы, ул. Тауелсіздік, 8','Зал',            100000,200000,'В процессе обмера'),
        ($1,$19,$12,'scheduled', $20,NULL,NULL,'Алматы, пр. Достык, 200',  'Офис 8 окон',    200000,400000,'Нужны жалюзи-зебра'),
        ($1,$21,$3,'scheduled', $22,NULL,NULL,'Алматы, ЖК Самал-2, 45',    'Спальня',         60000,120000,''),
        ($1,$23,$12,'cancelled',$24,NULL,NULL,'Алматы, ул. Панфилова, 99', 'Зал',             50000,100000,'Клиент отменил — переехал')
      RETURNING id, status
    `, [
      ORG_ID,
      c1.id,  designer1.id, daysAgo(30).toISOString(), daysAgo(30).toISOString(), daysAgo(29).toISOString(),  // completed
      c2.id,               daysAgo(20).toISOString(), daysAgo(20).toISOString(), daysAgo(20).toISOString(),  // completed
      c3.id,  designer2.id, daysAgo(14).toISOString(), daysAgo(14).toISOString(), daysAgo(13).toISOString(), // completed
      c4.id,               daysAgo(3).toISOString(),  daysAgo(3).toISOString(),                               // in_progress
      c5.id,  designer2.id, daysLater(2).toISOString(),                                                       // scheduled
      c7.id,               daysLater(5).toISOString(),                                                        // scheduled
      c8.id,               daysAgo(40).toISOString(),                                                         // cancelled
    ]);

    const [m1, m2, m3, m4, m5, m6, m7] = meas.rows;
    console.log('  Measurements:', meas.rows.map(m => m.status).join(', '));

    // ── 5. Сделки (deals) ──────────────────────────────────────────────────────
    console.log('Creating deals...');

    const deals = await client.query(`
      INSERT INTO deals (organization_id, client_id, designer_id, measurement_id, status, total_amount, prepayment, prepayment_percent, final_payment, payment_status, deadline)
      VALUES
        ($1,$2,$3,$4,  'completed',          285000, 142500, 50, 142500, 'paid',    $5),
        ($1,$6,$3,$7,  'in_production',      124000,  62000, 50,  62000, 'partial', $8),
        ($1,$9,$10,$11,'installation_scheduled',680000,340000,50,340000,'partial',  $12),
        ($1,$13,$3,$14,'proposal_sent',       165000,      0, 50, 165000,'pending', $15),
        ($1,$16,$10,NULL,'lead',                   0,      0, 50,      0,'pending', NULL),
        ($1,$17,$3,NULL,'measurement_scheduled',   0,      0, 50,      0,'pending', $18),
        ($1,$19,$10,NULL,'contract_signed',   92000,  46000, 50,  46000,'partial',  $20),
        ($1,$21,$3,NULL,'cancelled',          78000,      0, 50,  78000,'pending',  NULL)
      RETURNING id, status, client_id
    `, [
      ORG_ID,
      c1.id, designer1.id, m1.id, daysAgo(5).toISOString(),     // completed
      c2.id,              m2.id, daysLater(10).toISOString(),    // in_production
      c3.id, designer2.id,m3.id, daysLater(7).toISOString(),    // installation_scheduled
      c4.id,              m4.id, daysLater(14).toISOString(),    // proposal_sent
      c6.id, designer2.id,       daysLater(20).toISOString(),    // lead
      c7.id,                     daysLater(5).toISOString(),     // measurement_scheduled
      c9.id, designer2.id,       daysLater(12).toISOString(),    // contract_signed
      c8.id,                                                      // cancelled
    ]);

    const [d1, d2, d3, d4, d5, d6, d7, d8] = deals.rows;
    console.log('  Deals:', deals.rows.map(d => d.status).join(', '));

    // ── 6. Платежи ─────────────────────────────────────────────────────────────
    console.log('Creating payments...');

    await client.query(`
      INSERT INTO payments (organization_id, deal_id, amount, payment_type, payment_method, paid_at, notes, created_by)
      VALUES
        ($1,$2,142500,'prepayment',  'kaspi',  $3,'Аванс 50%',  $4),
        ($1,$2,142500,'final',       'cash',   $5,'Финал',       $4),
        ($1,$6, 62000,'prepayment',  'kaspi',  $7,'Аванс 50%',  $4),
        ($1,$8,340000,'prepayment',  'transfer',$9,'Аванс VIP', $4),
        ($1,$10,46000,'prepayment',  'kaspi',  $11,'Аванс 50%', $4)
      ON CONFLICT DO NOTHING
    `, [
      ORG_ID,
      d1.id, daysAgo(25).toISOString(), manager.id,
      daysAgo(5).toISOString(),
      d2.id, daysAgo(18).toISOString(),
      d3.id, daysAgo(10).toISOString(),
      d7.id, daysAgo(2).toISOString(),
    ]);

    // ── 7. События сделок ──────────────────────────────────────────────────────
    console.log('Creating deal events...');

    await client.query(`
      INSERT INTO deal_events (deal_id, event_type, old_status, new_status, created_by, notes)
      VALUES
        ($1,'status_change',NULL,'lead',$2,'Новая заявка с Instagram'),
        ($1,'status_change','lead','measurement_scheduled',$2,'Назначен замер'),
        ($1,'status_change','measurement_scheduled','measurement_done',$2,'Замер выполнен'),
        ($1,'status_change','measurement_done','proposal_sent',$2,'КП отправлено'),
        ($1,'status_change','proposal_sent','contract_signed',$2,'Договор подписан'),
        ($1,'status_change','contract_signed','in_production',$2,'Отдали в пошив'),
        ($1,'status_change','in_production','completed',$2,'Монтаж выполнен, клиент доволен'),
        ($3,'status_change',NULL,'lead',$2,'Заявка по рекомендации'),
        ($3,'status_change','lead','measurement_scheduled',$2,'Записали на замер'),
        ($3,'status_change','measurement_scheduled','measurement_done',$2,'Замер выполнен'),
        ($3,'status_change','measurement_done','in_production',$2,'Клиент одобрил образцы'),
        ($4,'status_change',NULL,'lead',$5,'Позвонила сама, VIP'),
        ($4,'status_change','lead','measurement_scheduled',$5,'Замер на дом'),
        ($4,'status_change','measurement_scheduled','measurement_done',$5,'Сложный объект, 5 комнат'),
        ($4,'status_change','measurement_done','proposal_sent',$5,'КП на 680к отправлено'),
        ($4,'status_change','proposal_sent','contract_signed',$5,'Согласовали'),
        ($4,'status_change','contract_signed','in_production',$5,'В пошиве'),
        ($4,'status_change','in_production','ready_for_installation',$5,'Готово к монтажу'),
        ($4,'status_change','ready_for_installation','installation_scheduled',$5,'Монтаж 1 июня')
      ON CONFLICT DO NOTHING
    `, [
      d1.id, manager.id,
      d2.id,
      d3.id, manager.id,
      d3.id, designer2.id,
    ]);

    // ── 8. Измерительные окна (measurement_windows) ────────────────────────────
    console.log('Creating measurement windows...');

    await client.query(`
      INSERT INTO measurement_windows (measurement_id, room_name, window_number, width_cm, height_cm, solution_type, fabric_code, notes)
      VALUES
        ($1,'Зал',     1, 320, 280, 'classic_curtain', 'blackout-premium', '2 полотна'),
        ($1,'Зал',     2, 180, 280, 'classic_curtain', 'blackout-premium', '1 полотно'),
        ($1,'Спальня', 1, 240, 260, 'classic_curtain', 'velvet-emerald',   'Блэкаут + тюль'),
        ($2,'Гостиная',1, 300, 270, 'roman_shade',     'roman-linen',      ''),
        ($2,'Гостиная',2, 300, 270, 'roman_shade',     'roman-linen',      ''),
        ($3,'Зал',     1, 400, 320, 'classic_curtain', 'velvet-emerald',   'Потолки 3.5м'),
        ($3,'Зал',     2, 400, 320, 'classic_curtain', 'velvet-emerald',   ''),
        ($3,'Спальня', 1, 280, 290, 'classic_curtain', 'blackout-premium', 'Полный блэкаут'),
        ($3,'Детская', 1, 240, 260, 'classic_curtain', 'blackout-classic', 'Дневной свет'),
        ($3,'Кухня',   1, 160, 200, 'roman_shade',     'roman-linen',      '')
      ON CONFLICT DO NOTHING
    `, [m1.id, m2.id, m3.id]);

    await client.query('COMMIT');

    console.log('\n✅ Demo data seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐  URL:       https://gardina-web.vercel.app');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑  Пароль для всех аккаунтов: Demo1234!');
    console.log('');
    console.log('👤  ADMIN');
    console.log('    Телефон:  +77001234567');
    console.log('    Пароль:   Demo1234!');
    console.log('');
    console.log('📋  МЕНЕДЖЕР — Айгерім Сейіткали');
    console.log('    Телефон:  +77071112233');
    console.log('    Пароль:   Demo1234!');
    console.log('');
    console.log('📐  ДИЗАЙНЕР — Дәмір Жақсыбеков');
    console.log('    Телефон:  +77072223344');
    console.log('    Пароль:   Demo1234!');
    console.log('');
    console.log('📐  ДИЗАЙНЕР — Аружан Нұрланова');
    console.log('    Телефон:  +77073334455');
    console.log('    Пароль:   Demo1234!');
    console.log('');
    console.log('💼  SALES — Ерлан Бекенов');
    console.log('    Телефон:  +77074445566');
    console.log('    Пароль:   Demo1234!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
