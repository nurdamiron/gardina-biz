-- Add login column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS login VARCHAR(100) UNIQUE;

-- Create index for login
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
