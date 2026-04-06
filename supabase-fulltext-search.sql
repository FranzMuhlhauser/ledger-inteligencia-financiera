-- Full-text search migration for invoices table
-- Run this in your Supabase SQL Editor to enable full-text search

-- Add search_vector column if not exists
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION update_invoice_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.numero_factura, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.proveedor, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.descripcion, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.tipo_documento, '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS update_invoice_search_vector_trigger ON invoices;
CREATE TRIGGER update_invoice_search_vector_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_search_vector();

-- Update existing rows
UPDATE invoices 
SET search_vector = 
  setweight(to_tsvector('spanish', COALESCE(numero_factura, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(proveedor, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(descripcion, '')), 'C') ||
  setweight(to_tsvector('spanish', COALESCE(tipo_documento, '')), 'D');

-- Create GIN index for full-text search
DROP INDEX IF EXISTS invoices_search_vector_idx;
CREATE INDEX invoices_search_vector_idx ON invoices USING GIN (search_vector);

-- Create index for tipo_documento filtering
DROP INDEX IF EXISTS invoices_tipo_documento_idx;
CREATE INDEX invoices_tipo_documento_idx ON invoices (tipo_documento);

-- Create composite index for common filters
DROP INDEX IF EXISTS invoices_user_fecha_idx;
CREATE INDEX invoices_user_fecha_idx ON invoices (user_id, fecha);

DROP INDEX IF EXISTS invoices_user_tipo_idx;
CREATE INDEX invoices_user_tipo_idx ON invoices (user_id, tipo_documento);
