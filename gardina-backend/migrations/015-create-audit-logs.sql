CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    entity_name TEXT,
    changes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

COMMENT ON COLUMN audit_logs.user_id IS 'Кто совершил действие';
COMMENT ON COLUMN audit_logs.user_name IS 'Имя пользователя на момент действия (для истории)';
COMMENT ON COLUMN audit_logs.action_type IS 'Тип действия (CLIENT_CREATED, ORDER_STATUS_UPDATED)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Тип сущности (Client, Order, Deal)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID сущности';
COMMENT ON COLUMN audit_logs.entity_name IS 'Имя/название сущности для быстрого отображения в логах';
COMMENT ON COLUMN audit_logs.changes IS 'Изменения в формате JSON { "old": {...}, "new": {...} }';
COMMENT ON COLUMN audit_logs.created_at IS 'Время действия в UTC';
