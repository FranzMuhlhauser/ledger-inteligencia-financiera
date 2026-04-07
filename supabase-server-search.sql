-- Enable server-side search with full-text search on invoices table
-- This adds a search_vector column that's automatically updated

-- Add search_vector column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'search_vector') THEN
    ALTER TABLE invoices ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- Create a function to update the search_vector
CREATE OR REPLACE FUNCTION invoices_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', coalesce(NEW.numero_factura, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.proveedor, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(NEW.descripcion, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(NEW.tipo_documento, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search_vector on insert/update
DROP TRIGGER IF EXISTS invoices_search_vector_update ON invoices;
CREATE TRIGGER invoices_search_vector_update
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION invoices_search_vector_update();

-- Backfill existing rows
UPDATE invoices SET search_vector =
  setweight(to_tsvector('spanish', coalesce(numero_factura, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(proveedor, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(descripcion, '')), 'B') ||
  setweight(to_tsvector('spanish', coalesce(tipo_documento, '')), 'C')
WHERE search_vector IS NULL;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_invoices_search_vector ON invoices USING GIN (search_vector);

-- Create a function for server-side search
CREATE OR REPLACE FUNCTION search_invoices(
  p_user_id UUID,
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  numero_factura TEXT,
  fecha DATE,
  proveedor TEXT,
  valor_neto NUMERIC,
  iva NUMERIC,
  valor_total NUMERIC,
  space_id UUID,
  descripcion TEXT,
  tipo_documento TEXT,
  archivo_url TEXT,
  archivo_nombre TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    inv.id,
    inv.numero_factura,
    inv.fecha,
    inv.proveedor,
    inv.valor_neto,
    inv.iva,
    inv.valor_total,
    inv.space_id,
    inv.descripcion,
    inv.tipo_documento,
    inv.archivo_url,
    inv.archivo_nombre,
    inv.created_at
  FROM invoices inv
  WHERE inv.user_id = p_user_id
    AND (
      p_search_query IS NULL 
      OR p_search_query = ''
      OR inv.search_vector @@ plainto_tsquery('spanish', p_search_query)
    )
  ORDER BY inv.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
