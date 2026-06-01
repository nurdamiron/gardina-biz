-- Demo enrichment: give SALES some clients (with deals) and fill the admin catalog (products).
DO $$
DECLARE
  org_id UUID;
  sales_id UUID;
BEGIN
  SELECT id INTO org_id FROM organizations WHERE slug = 'demo' LIMIT 1;
  SELECT id INTO sales_id FROM users WHERE organization_id = org_id AND role = 'sales' LIMIT 1;

  -- Reassign 4 clients (each has a deal) to the sales rep so Лиды + Воронка populate for them.
  UPDATE clients SET created_by = sales_id
   WHERE organization_id = org_id
     AND name IN ('Зарина Мусаева','Гүлнар Қасымова','Нұрбол Алиев','Бауыржан Ержанов');

  -- Catalog products (admin Каталог reads the products table, scoped by organization_id).
  INSERT INTO products (organization_id,name,code,type,category,price_per_meter,cost_price,brand,supplier,description,stock_quantity,unit,is_available)
  VALUES
    (org_id,'Блэкаут Премиум Антрацит','BL-001','fabric','curtain',4500,2600,'Arya','Arya','Полное затемнение, плотная ткань',120,'м',true),
    (org_id,'Блэкаут Класик Кремовый','BL-002','fabric','curtain',3200,1900,'Arya','Arya','Блэкаут для спальни',80,'м',true),
    (org_id,'Портьера Бархат Изумруд','PR-001','fabric','curtain',5800,3400,'Mona Lisa','Mona Lisa','Роскошный бархат для гостиной',40,'м',true),
    (org_id,'Портьера Лён Бежевый','PR-002','fabric','curtain',3900,2200,'Турция','Турция','Натуральный лён, нейтральный тон',90,'м',true),
    (org_id,'Тюль Вуаль Белый','TL-001','fabric','tulle',1200,650,'Турция','Турция','Лёгкая прозрачная вуаль',200,'м',true),
    (org_id,'Тюль Органза Молочный','TL-002','fabric','tulle',1800,950,'Китай','Китай','Органза с мягким блеском',150,'м',true),
    (org_id,'Карниз алюминиевый профиль 3м','KR-001','accessory','cornice',3500,2000,'Gardina','Gardina','Профильный карниз, потолочный монтаж',60,'шт',true),
    (org_id,'Рулонные жалюзи День-Ночь','ZH-001','blinds','blinds',6900,4100,'Louvolite','Louvolite','Система День-Ночь, цвет графит',35,'шт',true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Enrichment done.';
END $$;
