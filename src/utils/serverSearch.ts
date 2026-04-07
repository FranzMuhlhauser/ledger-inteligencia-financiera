import { supabase } from '../lib/supabase';

interface ServerSearchResult {
  id: string;
  numero_factura: string;
  fecha: string;
  proveedor: string;
  valor_neto: number;
  iva: number;
  valor_total: number;
  space_id: string | null;
  descripcion: string | null;
  tipo_documento: string | null;
  archivo_url: string | null;
  archivo_nombre: string | null;
  created_at: string;
}

/**
 * Search invoices on the server using full-text search
 * This is much faster than client-side filtering for large datasets
 */
export async function searchInvoicesOnServer(
  userId: string,
  searchQuery: string,
  limit: number = 50,
  offset: number = 0
): Promise<ServerSearchResult[]> {
  try {
    // Use the SQL function for full-text search
    const { data, error } = await supabase.rpc('search_invoices', {
      p_user_id: userId,
      p_search_query: searchQuery || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('Error searching invoices on server:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchInvoicesOnServer:', error);
    return [];
  }
}

/**
 * Get invoice count for pagination
 */
export async function getInvoiceCount(
  userId: string,
  searchQuery?: string
): Promise<number> {
  try {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (searchQuery) {
      // Use full-text search if query is provided
      const { data, error } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .textSearch('search_vector', searchQuery, { type: 'websearch' });

      if (error) throw error;
      return data?.length || 0;
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting invoice count:', error);
    return 0;
  }
}

/**
 * Check if server-side search is available
 * Returns false if the search_vector column or RPC function doesn't exist
 */
export async function isServerSearchAvailable(): Promise<boolean> {
  try {
    // Try to call the RPC function to see if it exists
    const { error } = await supabase.rpc('search_invoices', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_search_query: null,
      p_limit: 1,
      p_offset: 0,
    });

    // If error is about user not found, that's fine - the function exists
    // If error is about function not found, then we can't use server search
    return !error?.message?.includes('function does not exist');
  } catch {
    return false;
  }
}
