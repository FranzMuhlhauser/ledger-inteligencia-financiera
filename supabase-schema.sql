-- Supabase Schema for Ledger - Inteligencia Financiera
-- Run this SQL in your Supabase project's SQL Editor
-- =====================================================
-- v2 MIGRATION — Run if tables already exist
-- =====================================================
-- ALTER TABLE spaces ADD COLUMN IF NOT EXISTS presupuesto NUMERIC DEFAULT 0;
-- ALTER TABLE invoices
--   ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '',
--   ADD COLUMN IF NOT EXISTS tipo_documento TEXT DEFAULT 'Factura',
--   ADD COLUMN IF NOT EXISTS archivo_url TEXT,
--   ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;
-- =====================================================
-- Storage Bucket for receipts (run AFTER enabling Supabase Storage)
-- =====================================================
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('receipts', 'receipts', false)
--   ON CONFLICT DO NOTHING;
-- CREATE POLICY "Users manage own receipts"
--   ON storage.objects FOR ALL
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1])
--   WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- =====================================================

-- =====================================================
-- MIGRATION FOR EXISTING PROJECTS
-- If you already have an invoices table, run these commands:
-- =====================================================
-- ALTER TABLE invoices ADD COLUMN IF NOT EXISTS space_id UUID;
-- CREATE TABLE IF NOT EXISTS spaces (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   nombre TEXT NOT NULL,
--   icono TEXT NOT NULL DEFAULT 'folder',
--   color TEXT NOT NULL DEFAULT 'blue',
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
-- ALTER TABLE invoices ADD CONSTRAINT fk_space 
--   FOREIGN KEY (space_id) REFERENCES spaces(id) ON DELETE SET NULL;
-- =====================================================

-- Create spaces table for expense categories
CREATE TABLE IF NOT EXISTS spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  icono TEXT NOT NULL DEFAULT 'folder',
  color TEXT NOT NULL DEFAULT 'blue',
  presupuesto NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numero_factura TEXT NOT NULL,
  fecha DATE NOT NULL,
  proveedor TEXT NOT NULL,
  valor_neto NUMERIC NOT NULL DEFAULT 0,
  iva NUMERIC NOT NULL DEFAULT 0,
  valor_total NUMERIC NOT NULL DEFAULT 0,
  space_id UUID REFERENCES spaces(id) ON DELETE SET NULL,
  descripcion TEXT DEFAULT '',
  tipo_documento TEXT DEFAULT 'Factura',
  archivo_url TEXT,
  archivo_nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure each user can only have unique invoice numbers
  UNIQUE(user_id, numero_factura)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_fecha_idx ON invoices(fecha);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);
CREATE INDEX IF NOT EXISTS invoices_space_id_idx ON invoices(space_id);
CREATE INDEX IF NOT EXISTS spaces_user_id_idx ON spaces(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS on spaces
CREATE POLICY "Users can view their own spaces"
  ON spaces
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spaces"
  ON spaces
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spaces"
  ON spaces
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own spaces"
  ON spaces
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for RLS on invoices
-- Users can only view their own invoices
CREATE POLICY "Users can view their own invoices"
  ON invoices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own invoices
CREATE POLICY "Users can insert their own invoices"
  ON invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own invoices
CREATE POLICY "Users can update their own invoices"
  ON invoices
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own invoices
CREATE POLICY "Users can delete their own invoices"
  ON invoices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
