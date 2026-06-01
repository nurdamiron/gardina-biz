DO $$
DECLARE
  org_id UUID;
  pw_hash TEXT := '$2b$10$wlGlInCc.E4vZw/ZmHQRhOWfYEvoOXj5iu7nNTghLnIVea3bBB8qa';
  mgr_id UUID; des1_id UUID; des2_id UUID; sales_id UUID;
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID;
  c6 UUID; c7 UUID; c8 UUID; c9 UUID; c10 UUID;
  m1 UUID; m2 UUID; m3 UUID; m4 UUID; m5 UUID; m6 UUID;
  d1 UUID; d2 UUID; d3 UUID; d4 UUID; d5 UUID; d6 UUID; d7 UUID; d8 UUID;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'demo' LIMIT 1;

-- STAFF
INSERT INTO users (organization_id,name,phone,email,password_hash,role,is_active)
VALUES
  (org_id,'Айгерім Сейіткали', '+77071112233','aigerim@gardina.demo',pw_hash,'manager', true),
  (org_id,'Дәмір Жақсыбеков',  '+77072223344','damir@gardina.demo',  pw_hash,'designer',true),
  (org_id,'Аружан Нұрланова',  '+77073334455','aruzhan@gardina.demo',pw_hash,'designer',true),
  (org_id,'Ерлан Бекенов',     '+77074445566','erlan@gardina.demo',  pw_hash,'sales',   true)
ON CONFLICT (organization_id,phone) DO UPDATE SET role=EXCLUDED.role;

SELECT id INTO mgr_id   FROM users WHERE organization_id=org_id AND phone='+77071112233';
SELECT id INTO des1_id  FROM users WHERE organization_id=org_id AND phone='+77072223344';
SELECT id INTO des2_id  FROM users WHERE organization_id=org_id AND phone='+77073334455';
SELECT id INTO sales_id FROM users WHERE organization_id=org_id AND phone='+77074445566';

-- FABRICS
INSERT INTO fabrics (organization_id,name,code,description,type,price_per_meter,supplier,stock_quantity,is_available)
VALUES
  (org_id,'Блэкаут Премиум Антрацит', 'BL-001','Полное затемнение, плотная ткань',         'blackout',   4500,'Arya',    120,true),
  (org_id,'Блэкаут Класик Кремовый',  'BL-002','Блэкаут для спальни',                      'blackout',   3200,'Arya',    80, true),
  (org_id,'Блэкаут Серый Жемчуг',     'BL-003','Полублэкаут, мягкий свет',                 'semi_blackout',2800,'Турция',60, true),
  (org_id,'Портьера Бархат Изумруд',  'PR-001','Роскошный бархат для гостиной',             'decorative', 5800,'Mona Lisa',40,true),
  (org_id,'Портьера Лён Бежевый',     'PR-002','Натуральный лён, нейтральный тон',          'decorative', 3900,'Турция',  90,true),
  (org_id,'Тюль Вуаль Белый',         'TL-001','Лёгкая прозрачная вуаль',                  'transparent',1200,'Турция', 200,true),
  (org_id,'Тюль Органза Молочный',    'TL-002','Органза с мягким блеском',                 'transparent',1800,'Китай',  150,true),
  (org_id,'Декор Велюр Терракот',     'DK-001','Велюровые шторы для акцента',               'decorative', 4200,'Бельгия', 30,true)
;

-- CLIENTS
INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Айгүл Сейітова',  '+77011234567','+77011234567','Алматы, ул. Абая 45/3, кв.12',  'instagram','Постоянный клиент, нейтральные тона',mgr_id)
;
SELECT id INTO c1 FROM clients WHERE organization_id=org_id AND phone='+77011234567';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Марат Жақсыбеков','+77012345678','+77012345678','Алматы, мкр. Алатау 23, кв.5', 'instagram','Новый клиент',mgr_id)
;
SELECT id INTO c2 FROM clients WHERE organization_id=org_id AND phone='+77012345678';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Дина Нұрланова',  '+77013456789','+77013456789','Астана, ул. Достык 112, кв.88','whatsapp', 'VIP, 180 кв.м., бюджет до 800k',mgr_id)
;
SELECT id INTO c3 FROM clients WHERE organization_id=org_id AND phone='+77013456789';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Самал Ахметова',  '+77014567890','+77014567890','Алматы, ул. Тауелсіздік 8',    'referral','Порекомендовала Айгүл Сейітова',mgr_id)
;
SELECT id INTO c4 FROM clients WHERE organization_id=org_id AND phone='+77014567890';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Бауыржан Ержанов','+77015678901','+77015678901','Алматы, пр. Достык 200, кв.3', 'website', 'Офис, жалюзи на 8 окон',mgr_id)
;
SELECT id INTO c5 FROM clients WHERE organization_id=org_id AND phone='+77015678901';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Гүлнар Қасымова', '+77016789012','+77016789012','Астана, ЖК Нурлы жол, кв.34',  'instagram','Детская и гостиная',mgr_id)
;
SELECT id INTO c6 FROM clients WHERE organization_id=org_id AND phone='+77016789012';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Арман Сейткали',  '+77017890123','+77017890123','Алматы, мкр. Самал-2 45, кв.7','whatsapp','Переделывает ремонт',mgr_id)
;
SELECT id INTO c7 FROM clients WHERE organization_id=org_id AND phone='+77017890123';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Жанар Бекова',    '+77018901234','+77018901234','Алматы, ул. Панфилова 99, кв.2','referral','Шторы к 15 июня — горит дедлайн',mgr_id)
;
SELECT id INTO c8 FROM clients WHERE organization_id=org_id AND phone='+77018901234';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Нұрбол Алиев',    '+77019012345','+77019012345','Астана, ЖК Триумф, кв.201',     'instagram','Пентхаус, потолки 3.5м',mgr_id)
;
SELECT id INTO c9 FROM clients WHERE organization_id=org_id AND phone='+77019012345';

INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by)
VALUES (org_id,'Зарина Мусаева',  '+77010123456','+77010123456','Алматы, ул. Розыбакиева 10',    'website', 'Спальня и зал',mgr_id)
;
SELECT id INTO c10 FROM clients WHERE organization_id=org_id AND phone='+77010123456';

-- MEASUREMENTS
INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,started_at,completed_at,address,room_type,budget_min,budget_max,notes)
VALUES (org_id,c1,des1_id,'completed',NOW()-INTERVAL'30d',NOW()-INTERVAL'30d',NOW()-INTERVAL'29d','Алматы, ул. Абая 45/3','Зал + спальня',150000,300000,'Клиент доволен, замер прошёл отлично')
RETURNING id INTO m1;

INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,started_at,completed_at,address,room_type,budget_min,budget_max,notes)
VALUES (org_id,c2,des1_id,'completed',NOW()-INTERVAL'20d',NOW()-INTERVAL'20d',NOW()-INTERVAL'19d','Алматы, мкр. Алатау 23','Гостиная',80000,150000,'2 окна в зале')
RETURNING id INTO m2;

INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,started_at,completed_at,address,room_type,budget_min,budget_max,notes)
VALUES (org_id,c3,des2_id,'completed',NOW()-INTERVAL'14d',NOW()-INTERVAL'14d',NOW()-INTERVAL'13d','Астана, ул. Достык 112','Весь дом 5 комнат',400000,800000,'VIP клиент, нужны образцы тканей')
RETURNING id INTO m3;

INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,started_at,address,room_type,budget_min,budget_max,notes)
VALUES (org_id,c4,des1_id,'in_progress',NOW()-INTERVAL'3d',NOW()-INTERVAL'3d','Алматы, ул. Тауелсіздік 8','Зал',100000,200000,'В процессе обмера')
RETURNING id INTO m4;

INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,address,room_type,budget_min,budget_max,notes)
VALUES (org_id,c8,des2_id,'scheduled',NOW()+INTERVAL'2d','Алматы, ул. Панфилова 99','Зал',50000,100000,'Горит дедлайн — шторы к 15 июня')
RETURNING id INTO m5;

INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,address,room_type,budget_min,budget_max)
VALUES (org_id,c7,des1_id,'scheduled',NOW()+INTERVAL'5d','Алматы, мкр. Самал-2 45','Спальня',60000,120000)
RETURNING id INTO m6;

-- DEALS
INSERT INTO deals (organization_id,client_id,designer_id,measurement_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,deadline)
VALUES (org_id,c1,des1_id,m1,'completed',285000,142500,50,142500,'paid',NOW()-INTERVAL'5d')
RETURNING id INTO d1;

INSERT INTO deals (organization_id,client_id,designer_id,measurement_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,deadline)
VALUES (org_id,c2,des1_id,m2,'in_production',124000,62000,50,62000,'partial',NOW()+INTERVAL'10d')
RETURNING id INTO d2;

INSERT INTO deals (organization_id,client_id,designer_id,measurement_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,deadline)
VALUES (org_id,c3,des2_id,m3,'installation_scheduled',680000,340000,50,340000,'partial',NOW()+INTERVAL'7d')
RETURNING id INTO d3;

INSERT INTO deals (organization_id,client_id,designer_id,measurement_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,deadline)
VALUES (org_id,c4,des1_id,m4,'proposal_sent',165000,0,50,165000,'pending',NOW()+INTERVAL'14d')
RETURNING id INTO d4;

INSERT INTO deals (organization_id,client_id,designer_id,status,total_amount,payment_status,deadline)
VALUES (org_id,c6,des2_id,'lead',0,'pending',NOW()+INTERVAL'20d')
RETURNING id INTO d5;

INSERT INTO deals (organization_id,client_id,designer_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,deadline)
VALUES (org_id,c9,des2_id,'contract_signed',920000,460000,50,460000,'partial',NOW()+INTERVAL'12d')
RETURNING id INTO d6;

INSERT INTO deals (organization_id,client_id,designer_id,status,total_amount,payment_status,deadline)
VALUES (org_id,c10,des1_id,'measurement_scheduled',0,'pending',NOW()+INTERVAL'5d')
RETURNING id INTO d7;

INSERT INTO deals (organization_id,client_id,designer_id,status,total_amount,payment_status)
VALUES (org_id,c5,des2_id,'cancelled',78000,'pending')
RETURNING id INTO d8;

-- PAYMENTS
INSERT INTO payments (organization_id,deal_id,type,amount,payment_method,paid_at,note,created_by)
VALUES
  (org_id,d1,'prepayment',142500,'online',  NOW()-INTERVAL'25d','Аванс 50% (Kaspi)',mgr_id),
  (org_id,d1,'final',     142500,'cash',    NOW()-INTERVAL'5d', 'Финальный расчёт',mgr_id),
  (org_id,d2,'prepayment', 62000,'online',  NOW()-INTERVAL'15d','Аванс 50% (Kaspi)',mgr_id),
  (org_id,d3,'prepayment',340000,'transfer',NOW()-INTERVAL'8d', 'Аванс VIP клиент',mgr_id),
  (org_id,d6,'prepayment',460000,'online',  NOW()-INTERVAL'2d', 'Аванс 50% (Kaspi)',mgr_id);

-- DEAL EVENTS
INSERT INTO deal_events (organization_id,deal_id,event_type,description,created_by)
VALUES
  (org_id,d1,'status_change','Заявка с Instagram → lead',mgr_id),
  (org_id,d1,'status_change','lead → Назначен замер',mgr_id),
  (org_id,d1,'status_change','Замер выполнен → measurement_done',mgr_id),
  (org_id,d1,'status_change','КП отправлено клиенту',mgr_id),
  (org_id,d1,'status_change','Договор подписан',mgr_id),
  (org_id,d1,'status_change','Отдали в пошив',mgr_id),
  (org_id,d1,'status_change','Пошив готов',mgr_id),
  (org_id,d1,'status_change','Монтаж назначен',mgr_id),
  (org_id,d1,'status_change','Монтаж выполнен успешно',mgr_id),
  (org_id,d1,'status_change','Клиент принял работу, очень доволен',mgr_id),
  (org_id,d2,'status_change','Рекомендация от Айгүл → lead',mgr_id),
  (org_id,d2,'status_change','Записали на замер',mgr_id),
  (org_id,d2,'status_change','Замер выполнен',des1_id),
  (org_id,d2,'status_change','КП отправлено',des1_id),
  (org_id,d2,'status_change','Клиент одобрил образцы, отдали в пошив',mgr_id),
  (org_id,d3,'status_change','VIP звонок → lead',mgr_id),
  (org_id,d3,'status_change','Замер на дом назначен',mgr_id),
  (org_id,d3,'status_change','5 комнат замерено',des2_id),
  (org_id,d3,'status_change','КП на 680 000 ₸ отправлено',des2_id),
  (org_id,d3,'status_change','Согласовано, договор подписан',mgr_id),
  (org_id,d3,'status_change','Передано в пошив',mgr_id),
  (org_id,d3,'status_change','Пошив завершён',mgr_id),
  (org_id,d3,'status_change','Монтаж назначен на 1 июня',mgr_id);

-- MEASUREMENT WINDOWS
INSERT INTO measurement_windows (measurement_id,room_name,window_number,width_left,width_center,width_right,height_left,height_center,height_right,notes)
VALUES
  (m1,'Зал',     1,320,318,322,280,278,280,'2 полотна, блэкаут'),
  (m1,'Зал',     2,180,179,181,280,279,280,'1 полотно'),
  (m1,'Спальня', 1,240,238,242,260,259,261,'Блэкаут + тюль'),
  (m2,'Гостиная',1,300,298,302,270,268,271,'Римская штора'),
  (m2,'Гостиная',2,300,299,301,270,270,269,'Римская штора'),
  (m3,'Зал',     1,400,398,402,320,318,321,'Потолки 3.5м'),
  (m3,'Зал',     2,400,399,401,320,319,320,''),
  (m3,'Спальня', 1,280,279,281,290,288,290,'Полный блэкаут'),
  (m3,'Детская', 1,240,239,241,260,260,261,'Дневной свет'),
  (m3,'Кухня',   1,160,159,161,200,199,200,'Компактная');

RAISE NOTICE 'Done!';
END $$;
