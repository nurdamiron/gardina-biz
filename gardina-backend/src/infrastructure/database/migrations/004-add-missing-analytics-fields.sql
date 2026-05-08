-- Add source column to clients table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'source'
    ) THEN
        ALTER TABLE clients
        ADD COLUMN source VARCHAR(100);

        -- Set default sources for existing clients
        UPDATE clients
        SET source = CASE
            WHEN random() < 0.35 THEN 'Instagram'
            WHEN random() < 0.65 THEN 'Сарафан'
            WHEN random() < 0.85 THEN 'Google'
            WHEN random() < 0.95 THEN '2GIS'
            ELSE 'WhatsApp'
        END
        WHERE source IS NULL;

        CREATE INDEX idx_clients_source ON clients(source);
        RAISE NOTICE 'Added source column to clients table';
    ELSE
        RAISE NOTICE 'source column already exists in clients table';
    END IF;
END $$;

-- Add stage column to clients table for funnel tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'stage'
    ) THEN
        ALTER TABLE clients
        ADD COLUMN stage VARCHAR(50) DEFAULT 'lead';

        -- Update stages based on their deals
        UPDATE clients c
        SET stage = CASE
            WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status = 'completed') THEN 'customer'
            WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status IN ('ready', 'installing')) THEN 'contract'
            WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status = 'in_production') THEN 'proposal'
            WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status = 'measured') THEN 'meeting'
            ELSE 'lead'
        END
        WHERE stage = 'lead' OR stage IS NULL;

        CREATE INDEX idx_clients_stage ON clients(stage);
        RAISE NOTICE 'Added stage column to clients table';
    ELSE
        RAISE NOTICE 'stage column already exists in clients table';
    END IF;
END $$;

-- Add monthly_target to users for KPI tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'monthly_target'
    ) THEN
        ALTER TABLE users
        ADD COLUMN monthly_target INTEGER DEFAULT 20;

        -- Set different targets based on role
        UPDATE users
        SET monthly_target = CASE
            WHEN role = 'designer' THEN 20
            WHEN role = 'manager' THEN 50
            ELSE 0
        END;

        RAISE NOTICE 'Added monthly_target column to users table';
    ELSE
        RAISE NOTICE 'monthly_target column already exists in users table';
    END IF;
END $$;

-- Add customer_rating to deals for satisfaction tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals'
        AND column_name = 'customer_rating'
    ) THEN
        ALTER TABLE deals
        ADD COLUMN customer_rating NUMERIC(2,1) CHECK (customer_rating >= 0 AND customer_rating <= 5);

        -- Set random ratings for completed deals
        UPDATE deals
        SET customer_rating = 3.5 + (random() * 1.5)
        WHERE status = 'completed' AND customer_rating IS NULL;

        RAISE NOTICE 'Added customer_rating column to deals table';
    ELSE
        RAISE NOTICE 'customer_rating column already exists in deals table';
    END IF;
END $$;

-- Create deal_products table for tracking product sales
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'deal_products'
    ) THEN
        CREATE TABLE deal_products (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
            product_id UUID NOT NULL REFERENCES products(id),
            quantity NUMERIC(10,2) NOT NULL,
            unit_price NUMERIC(10,2) NOT NULL,
            total_price NUMERIC(10,2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_deal_products_deal ON deal_products(deal_id);
        CREATE INDEX idx_deal_products_product ON deal_products(product_id);

        RAISE NOTICE 'Created deal_products table';
    ELSE
        RAISE NOTICE 'deal_products table already exists';
    END IF;
END $$;

-- Add sample deal_products data for existing deals
DO $$
DECLARE
    deal_record RECORD;
    product_record RECORD;
    products_per_deal INTEGER;
    i INTEGER;
BEGIN
    -- Only populate if table is empty
    IF NOT EXISTS (SELECT 1 FROM deal_products LIMIT 1) THEN
        FOR deal_record IN SELECT id, total_amount FROM deals LIMIT 30
        LOOP
            products_per_deal := 1 + floor(random() * 3)::integer;

            FOR i IN 1..products_per_deal
            LOOP
                SELECT id, price_per_meter
                INTO product_record
                FROM products
                ORDER BY random()
                LIMIT 1;

                IF product_record.id IS NOT NULL THEN
                    INSERT INTO deal_products (
                        deal_id,
                        product_id,
                        quantity,
                        unit_price,
                        total_price
                    ) VALUES (
                        deal_record.id,
                        product_record.id,
                        2 + random() * 10,
                        product_record.price_per_meter,
                        (2 + random() * 10) * product_record.price_per_meter
                    );
                END IF;
            END LOOP;
        END LOOP;

        RAISE NOTICE 'Added sample deal_products data';
    END IF;
END $$;

-- Add efficiency_score to users for team efficiency tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'efficiency_score'
    ) THEN
        ALTER TABLE users
        ADD COLUMN efficiency_score NUMERIC(5,2) DEFAULT 75.00;

        -- Set random efficiency scores
        UPDATE users
        SET efficiency_score = 70 + (random() * 30)
        WHERE role IN ('designer', 'manager');

        RAISE NOTICE 'Added efficiency_score column to users table';
    ELSE
        RAISE NOTICE 'efficiency_score column already exists in users table';
    END IF;
END $$;