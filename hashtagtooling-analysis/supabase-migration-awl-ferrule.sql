-- Add awl_ferrule_premium to materials (required for Custom Awl builder)
-- Run after supabase-setup-step1-tables.sql

ALTER TABLE materials ADD COLUMN IF NOT EXISTS awl_ferrule_premium DECIMAL(10,2) DEFAULT 0;
