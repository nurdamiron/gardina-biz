-- Add designer_id to deals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals'
        AND column_name = 'designer_id'
    ) THEN
        ALTER TABLE deals
        ADD COLUMN designer_id UUID REFERENCES users(id);

        -- Create index for better performance
        CREATE INDEX idx_deals_designer_id ON deals(designer_id);

        RAISE NOTICE 'Added designer_id column to deals table';
    ELSE
        RAISE NOTICE 'designer_id column already exists in deals table';
    END IF;
END $$;

-- Add manager_id to deals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deals'
        AND column_name = 'manager_id'
    ) THEN
        ALTER TABLE deals
        ADD COLUMN manager_id UUID REFERENCES users(id);

        -- Create index for better performance
        CREATE INDEX idx_deals_manager_id ON deals(manager_id);

        RAISE NOTICE 'Added manager_id column to deals table';
    ELSE
        RAISE NOTICE 'manager_id column already exists in deals table';
    END IF;
END $$;

-- Add designer_id to measurements table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'measurements'
        AND column_name = 'designer_id'
    ) THEN
        ALTER TABLE measurements
        ADD COLUMN designer_id UUID REFERENCES users(id);

        -- Create index for better performance
        CREATE INDEX idx_measurements_designer_id ON measurements(designer_id);

        RAISE NOTICE 'Added designer_id column to measurements table';
    ELSE
        RAISE NOTICE 'designer_id column already exists in measurements table';
    END IF;
END $$;

-- Add client stage tracking for funnel analysis
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'clients'
        AND column_name = 'stage'
    ) THEN
        -- Add stage column with default value
        ALTER TABLE clients
        ADD COLUMN stage VARCHAR(50) DEFAULT 'lead';

        -- Add source column for tracking acquisition channels
        ALTER TABLE clients
        ADD COLUMN source VARCHAR(100);

        -- Create index for stage queries
        CREATE INDEX idx_clients_stage ON clients(stage);
        CREATE INDEX idx_clients_source ON clients(source);

        RAISE NOTICE 'Added stage and source columns to clients table';
    ELSE
        RAISE NOTICE 'stage column already exists in clients table';
    END IF;
END $$;

-- Update existing data with reasonable defaults
UPDATE deals
SET designer_id = (
    SELECT m.designer_id
    FROM measurements m
    WHERE m.id = deals.measurement_id
    LIMIT 1
)
WHERE designer_id IS NULL
AND measurement_id IS NOT NULL;

-- Set client stages based on their deals
UPDATE clients c
SET stage = CASE
    WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status = 'completed') THEN 'customer'
    WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status IN ('contract_signed', 'in_production')) THEN 'contract'
    WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status = 'proposal_accepted') THEN 'proposal'
    WHEN EXISTS (SELECT 1 FROM deals d WHERE d.client_id = c.id AND d.status IN ('proposal_sent', 'measured')) THEN 'meeting'
    ELSE 'lead'
END
WHERE stage = 'lead' OR stage IS NULL;