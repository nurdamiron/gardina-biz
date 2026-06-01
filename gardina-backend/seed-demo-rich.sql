-- =====================================================================
-- Gardina demo — RICH, fully-connected dataset (org slug='demo').
-- Coherent funnel: clients(leads) > deals > completed; revenue kept realistic.
-- Money flows bottom-up so every screen agrees:
--   window line-items -> room total (clientCheck.total) -> proposal -> deal -> payments
-- Run: psql -d gardina_demo -f seed-demo-rich.sql
-- =====================================================================

CREATE OR REPLACE FUNCTION pg_temp.room_total(w_mm int) RETURNS numeric AS $f$
DECLARE
  W numeric := w_mm / 1000.0;
  mb int; mt int; tfm int;
  fab numeric; sew numeric; tape numeric; hooks numeric; cornice numeric; install numeric;
BEGIN
  IF w_mm IS NULL OR w_mm <= 0 THEN RETURN 0; END IF;
  mb := ceil(W*2 + 0.5); mt := ceil(W*3 + 0.5); tfm := mb + mt;
  fab := mb*4500 + mt*1200;
  sew := tfm*1700;
  tape := ceil(tfm/50.0)*2500;
  hooks := ceil((tfm*5)/100.0)*1500;
  cornice := round(W*3500); install := round(W*1500);
  RETURN fab + sew + tape + hooks + cornice + install;
END $f$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.win_pb(w_mm int) RETURNS jsonb AS $f$
  SELECT jsonb_build_object(
    'fabricItems', jsonb_build_array(
      jsonb_build_object('fabricName','Блэкаут Премиум Антрацит','fabricCode','BL-001','fabricType','blackout','pricePerMeter',4500),
      jsonb_build_object('fabricName','Тюль Вуаль Белый','fabricCode','TL-001','fabricType','tulle','pricePerMeter',1200)
    ),
    'sewingRate', 1700, 'installationRate', 1500,
    'cornice', jsonb_build_object('needed',true,'name','Карниз профильный','pricePerMeter',3500),
    'clientCheck', jsonb_build_object('total', pg_temp.room_total(w_mm))
  );
$f$ LANGUAGE sql;

DO $$
DECLARE
  org_id UUID; mgr_id UUID; des1_id UUID; des2_id UUID; sales_id UUID;
  r RECORD; cid UUID; mid UUID; pid UUID; did UUID;
  v_total NUMERIC; v_prepay NUMERIC; v_final NUMERIC; v_created TIMESTAMP;
  v_meas_done BOOLEAN; v_has_prop BOOLEAN; v_prepaid BOOLEAN; v_paid BOOLEAN; v_measured BOOLEAN;
  v_pay_status TEXT; v_prop_status TEXT; v_meas_status TEXT; v_owner UUID; v_designer UUID;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug='demo' LIMIT 1;
  SELECT id INTO mgr_id   FROM users WHERE organization_id=org_id AND role='manager' ORDER BY created_at LIMIT 1;
  SELECT id INTO des1_id  FROM users WHERE organization_id=org_id AND phone='+77072223344';
  SELECT id INTO des2_id  FROM users WHERE organization_id=org_id AND phone='+77073334455';
  SELECT id INTO sales_id FROM users WHERE organization_id=org_id AND role='sales' ORDER BY created_at LIMIT 1;

  UPDATE deals SET measurement_id=NULL, proposal_id=NULL WHERE organization_id=org_id;
  UPDATE measurements SET deal_id=NULL WHERE organization_id=org_id;
  DELETE FROM payments WHERE organization_id=org_id;
  DELETE FROM deal_events WHERE deal_id IN (SELECT id FROM deals WHERE organization_id=org_id);
  DELETE FROM proposals WHERE organization_id=org_id;
  DELETE FROM measurement_windows WHERE measurement_id IN (SELECT id FROM measurements WHERE organization_id=org_id);
  DELETE FROM measurements WHERE organization_id=org_id;
  DELETE FROM deals WHERE organization_id=org_id;
  DELETE FROM clients WHERE organization_id=org_id;

  -- Релевантные фото по коду товара (Unsplash CDN, стабильные ссылки).
  -- ELSE — нейтральная штора у окна для любых неучтённых кодов.
  UPDATE products SET cost_price = ROUND(price_per_meter*0.58),
                      image_url  = CASE code
    WHEN 'TL-001' THEN 'https://images.unsplash.com/photo-1528822855841-e8bf3134cdc9?auto=format&fit=crop&w=1200&q=80' -- белый прозрачный тюль
    WHEN 'TL-002' THEN 'https://images.unsplash.com/photo-1745242395967-c69b5af856a6?auto=format&fit=crop&w=1200&q=80' -- молочная органза
    WHEN 'BL-001' THEN 'https://images.unsplash.com/photo-1581495009654-777d243766e8?auto=format&fit=crop&w=1200&q=80' -- блэкаут антрацит
    WHEN 'BL-002' THEN 'https://images.unsplash.com/photo-1771039622237-2725bdf33edf?auto=format&fit=crop&w=1200&q=80' -- блэкаут кремовый
    WHEN 'PR-001' THEN 'https://images.unsplash.com/photo-1733896967858-40ab7ea3f94f?auto=format&fit=crop&w=1200&q=80' -- бархат изумруд
    WHEN 'PR-002' THEN 'https://images.unsplash.com/photo-1754611380518-61a923cc47ca?auto=format&fit=crop&w=1200&q=80' -- лён бежевый
    WHEN 'RM-001' THEN 'https://images.unsplash.com/photo-1715713810564-f31bbcd8e227?auto=format&fit=crop&w=1200&q=80' -- римская штора
    WHEN 'ZB-001' THEN 'https://images.unsplash.com/photo-1532372092598-facb13a6b2ad?auto=format&fit=crop&w=1200&q=80' -- жалюзи зебра
    ELSE 'https://images.unsplash.com/photo-1611822506999-793d04b7ddd8?auto=format&fit=crop&w=1200&q=80'              -- штора у окна (fallback)
  END
  WHERE organization_id=org_id;

  FOR r IN SELECT * FROM (VALUES
    --cname              cphone          caddr                              csrc        owner   designer rooms              status                   w1    w2    days rating
    -- 8 deals (smaller windows → realistic salon revenue)
    ('Айгүл Сейітова',   '+77011234567','Алматы, ул. Абая 45/3, кв.12',     'instagram','mgr',  'des1', 'Гостиная, спальня','completed',             2200, 1700, 142, 5),
    ('Дина Нұрланова',   '+77013456789','Астана, ул. Достык 112, кв.88',    'whatsapp', 'mgr',  'des2', 'Гостиная',         'completed',             2000, 1800, 120, 5),
    ('Марат Жақсыбеков', '+77012345678','Алматы, мкр. Алатау 23, кв.5',     'instagram','mgr',  'des1', 'Гостиная',         'installed',             1900, 1600, 96,  NULL),
    ('Нұрбол Алиев',     '+77019012345','Астана, ЖК Триумф, кв.201',        'instagram','sales','des1', 'Гостиная',         'ready_for_installation',2200, 1900, 60,  NULL),
    ('Бауыржан Ержанов', '+77015678901','Алматы, пр. Достык 200, кв.3',     'website',  'sales','des2', 'Кабинет',          'in_production',         1800, 1500, 48,  NULL),
    ('Зарина Мусаева',   '+77010123456','Алматы, ул. Розыбакиева 10',       'website',  'sales','des2', 'Спальня, зал',     'contract_signed',       2000, 1600, 30,  NULL),
    ('Арман Сейткали',   '+77017890123','Алматы, мкр. Самал-2 45, кв.7',    'whatsapp', 'mgr',  'des1', 'Спальня',          'proposal_accepted',     1700, 1500, 22,  NULL),
    ('Жанар Бекова',     '+77018901234','Алматы, ул. Панфилова 99, кв.2',   'referral', 'mgr',  'des2', 'Гостиная',         'proposal_sent',         2100, 1700, 14,  NULL),
    -- 2 scheduled measurements (deal value 0)
    ('Камила Идрисова',  '+77022223344','Астана, ЖК Highvill, кв.45',       'instagram','mgr',  'des2', 'Детская',          'measurement_scheduled', 0,    0,    -3,  NULL),
    ('Ербол Сапаров',    '+77023334455','Алматы, ул. Тимирязева 28',        'whatsapp', 'sales','des1', 'Гостиная',         'measurement_scheduled', 0,    0,    -5,  NULL),
    -- 5 leads (client only — no deal yet)
    ('Аяна Жумабаева',   '+77024445566','Шымкент, мкр. Нурсат 7',           'website',  'mgr',  'des2', 'Спальня',          'lead',                  0,    0,    1,   NULL),
    ('Олжас Тулеуов',    '+77021112233','Алматы, мкр. Орбита-3 12',         'instagram','sales','des1', 'Кухня, зал',       'lead',                  0,    0,    2,   NULL),
    ('Динара Ким',       '+77025556677','Алматы, ул. Гагарина 145',         'instagram','sales','des2', 'Гостиная',         'lead',                  0,    0,    3,   NULL),
    ('Тимур Абенов',     '+77026667788','Астана, ЖК Изумрудный, кв.12',     'whatsapp', 'mgr',  'des1', 'Спальня, кабинет', 'lead',                  0,    0,    4,   NULL),
    ('Мадина Оспанова',  '+77027778899','Алматы, мкр. Аксай-4 6',           'referral', 'sales','des2', 'Детская',          'lead',                  0,    0,    6,   NULL)
  ) AS t(cname,cphone,caddr,csrc,owner,designer,rooms,status,w1,w2,days,rating)
  LOOP
    v_owner    := CASE r.owner WHEN 'sales' THEN sales_id ELSE mgr_id END;
    v_designer := CASE r.designer WHEN 'des2' THEN des2_id ELSE des1_id END;
    v_created  := NOW() - (r.days || ' days')::INTERVAL;

    INSERT INTO clients (organization_id,name,phone,whatsapp,address,source,notes,created_by,created_at)
    VALUES (org_id,r.cname,r.cphone,r.cphone,r.caddr,r.csrc,r.rooms,v_owner,v_created)
    RETURNING id INTO cid;

    -- Leads stop here: a client without a deal/measurement.
    CONTINUE WHEN r.status = 'lead';

    v_measured  := r.status NOT IN ('measurement_scheduled');
    v_meas_done := v_measured;
    v_has_prop  := r.status IN ('proposal_sent','proposal_accepted','contract_signed','in_production','ready_for_installation','installation_scheduled','installed','completed');
    v_prepaid   := r.status IN ('contract_signed','in_production','ready_for_installation','installation_scheduled','installed','completed');
    v_paid      := r.status = 'completed';

    v_total  := pg_temp.room_total(r.w1::int) + pg_temp.room_total(r.w2::int);
    v_prepay := CASE WHEN v_prepaid THEN ROUND(v_total*0.5) ELSE 0 END;
    v_final  := CASE WHEN v_paid THEN v_total - v_prepay ELSE 0 END;
    v_pay_status := CASE WHEN v_paid THEN 'paid' WHEN v_prepaid THEN 'partial' ELSE 'pending' END;
    v_meas_status := CASE WHEN v_meas_done THEN 'completed' ELSE 'scheduled' END;

    INSERT INTO measurements (organization_id,client_id,designer_id,status,scheduled_at,started_at,completed_at,address,room_type,budget_min,budget_max,client_reaction,notes,created_at)
    VALUES (org_id,cid,v_designer,v_meas_status::measurement_status,
            v_created + INTERVAL '1 day',
            CASE WHEN v_meas_done THEN v_created + INTERVAL '2 day' ELSE NULL END,
            CASE WHEN v_meas_done THEN v_created + INTERVAL '2 day' ELSE NULL END,
            r.caddr, r.rooms,
            CASE WHEN v_total>0 THEN ROUND(v_total*0.8) ELSE 120000 END,
            CASE WHEN v_total>0 THEN ROUND(v_total*1.3) ELSE 300000 END,
            CASE WHEN v_paid THEN 'positive' ELSE NULL END,
            'Замер по адресу', v_created)
    RETURNING id INTO mid;

    IF v_measured THEN
      INSERT INTO measurement_windows (measurement_id,window_number,room_name,width_left,width_center,width_right,height_left,height_center,height_right,mounting_type,top_offset,sill_height,fabric_code,fabric_brand,price_breakdown,notes,created_at)
      VALUES
        (mid,1,split_part(r.rooms,',',1),r.w1,r.w1,r.w1,2750,2755,2750,'ceiling',120,850,'BL-001','Arya',pg_temp.win_pb(r.w1::int),'Блэкаут + тюль, потолочный карниз',v_created+INTERVAL '2 day'),
        (mid,2,COALESCE(NULLIF(trim(split_part(r.rooms,',',2)),''),'Окно 2'),r.w2,r.w2,r.w2,2700,2705,2700,'wall',150,820,'TL-001','Турция',pg_temp.win_pb(r.w2::int),'Тюль вуаль',v_created+INTERVAL '2 day');
    END IF;

    pid := NULL;
    IF v_has_prop THEN
      v_prop_status := CASE WHEN r.status='proposal_sent' THEN 'sent' ELSE 'accepted' END;
      INSERT INTO proposals (organization_id,measurement_id,client_id,designer_id,variant_name,fabric_meters,fabric_cost,sewing_cost,installation_cost,additional_costs,discount_percent,total_cost,status,sent_at,viewed_at,decided_at,notes,created_at)
      VALUES (org_id,mid,cid,v_designer,'Вариант 1',
              ROUND((r.w1+r.w2)/1000.0*2.5,1),
              ROUND(v_total*0.50), ROUND(v_total*0.25), ROUND(v_total*0.15),
              jsonb_build_object('Карниз и доставка', ROUND(v_total*0.10)), 0, v_total,
              v_prop_status::proposal_status, v_created + INTERVAL '3 day',
              CASE WHEN r.status<>'proposal_sent' THEN v_created + INTERVAL '4 day' ELSE NULL END,
              CASE WHEN r.status<>'proposal_sent' THEN v_created + INTERVAL '5 day' ELSE NULL END,
              'КП по результатам замера', v_created + INTERVAL '3 day')
      RETURNING id INTO pid;
    END IF;

    INSERT INTO deals (organization_id,client_id,designer_id,manager_id,measurement_id,proposal_id,status,total_amount,prepayment,prepayment_percent,final_payment,payment_status,designer_commission_percent,designer_commission,customer_rating,deadline,created_at)
    VALUES (org_id,cid,v_designer,mgr_id,mid,pid,r.status::deal_status,v_total,v_prepay,
            CASE WHEN v_prepaid THEN 50 ELSE 0 END, v_final, v_pay_status::payment_status,
            10, ROUND(v_total*0.10), r.rating, (v_created + INTERVAL '30 day')::date, v_created)
    RETURNING id INTO did;

    UPDATE measurements SET deal_id=did WHERE id=mid;

    IF v_prepaid THEN
      INSERT INTO payments (organization_id,deal_id,measurement_id,type,amount,payment_method,paid_at,note,created_by,created_at)
      VALUES (org_id,did,mid,'prepayment',v_prepay,'online',v_created + INTERVAL '6 day','Аванс 50% (Kaspi)',mgr_id,v_created + INTERVAL '6 day');
    END IF;
    IF v_paid THEN
      INSERT INTO payments (organization_id,deal_id,measurement_id,type,amount,payment_method,paid_at,note,created_by,created_at)
      VALUES (org_id,did,mid,'final',v_final,'cash',v_created + INTERVAL '20 day','Финальный расчёт',mgr_id,v_created + INTERVAL '20 day');
    END IF;
  END LOOP;

  RAISE NOTICE 'Rich connected demo data seeded (coherent funnel).';
END $$;
