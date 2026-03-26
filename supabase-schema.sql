-- Supabase Schema for Ledger - Inteligencia Financiera
-- Run this SQL in your Supabase project's SQL Editor

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure each user can only have unique invoice numbers
  UNIQUE(user_id, numero_factura)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_fecha_idx ON invoices(fecha);
CREATE INDEX IF NOT EXISTS invoices_created_at_idx ON invoices(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
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
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
