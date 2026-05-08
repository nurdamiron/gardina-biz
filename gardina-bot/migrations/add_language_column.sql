-- Migration: add language column to bot_users
-- Run this once on existing databases before deploying the multilingual update.

ALTER TABLE bot_users ADD COLUMN IF NOT EXISTS language VARCHAR(2) DEFAULT 'ru' NOT NULL;
