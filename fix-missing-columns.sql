-- =================================================================
-- FIX MISSING COLUMNS - Run this in Supabase SQL Editor
-- =================================================================
-- This adds the missing columns that are causing the errors

-- Add missing column to spaces table
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS presupuesto NUMERIC DEFAULT 0;

-- Add missing columns to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tipo_documento TEXT DEFAULT 'Factura';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS archivo_url TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;

-- Verify the columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('spaces', 'invoices')
ORDER BY table_name, ordinal_position;
