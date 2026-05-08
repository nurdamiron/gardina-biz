-- Add contract_signed status to deal_status enum
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'contract_signed' AFTER 'measured';
