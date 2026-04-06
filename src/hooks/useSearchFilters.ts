import { useState, useEffect, useMemo, useCallback } from 'react';

// Custom hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Search preferences interface
export interface SearchPreferences {
  searchQuery: string;
  tipoDocumento: 'todos' | 'Factura' | 'Boleta';
  valorMinimo?: number;
  valorMaximo?: number;
  proveedor?: string;
  conArchivo?: boolean;
  spaceId?: string;
  numeroFactura?: string;
  fechaAnio?: string;
  fechaMes?: string;
  fechaDia?: string;
}

// Recent search item
export interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
  filters: Omit<SearchPreferences, 'searchQuery'>;
}

// Hook for managing recent searches
export function useRecentSearches(maxItems: number = 10) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    try {
      const saved = localStorage.getItem('ledger_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ledger_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const addSearch = useCallback((query: string, filters: Omit<SearchPreferences, 'searchQuery'>) => {
    if (!query.trim()) return;

    const newSearch: RecentSearch = {
      id: crypto.randomUUID(),
      query,
      timestamp: Date.now(),
      filters,
    };

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(s => s.query !== query);
      // Add new and keep only maxItems
      return [newSearch, ...filtered].slice(0, maxItems);
    });
  }, [maxItems]);

  const removeSearch = useCallback((id: string) => {
    setRecentSearches(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return { recentSearches, addSearch, removeSearch, clearSearches };
}

// Hook for search filters with localStorage persistence
export function useSearchFilters() {
  const [filters, setFilters] = useState<SearchPreferences>(() => {
    try {
      const saved = localStorage.getItem('ledger_search_filters');
      return saved ? JSON.parse(saved) : {
        searchQuery: '',
        tipoDocumento: 'todos',
        valorMinimo: undefined,
        valorMaximo: undefined,
        proveedor: undefined,
        conArchivo: undefined,
        spaceId: undefined,
        numeroFactura: undefined,
        fechaAnio: undefined,
        fechaMes: undefined,
        fechaDia: undefined,
      };
    } catch {
      return {
        searchQuery: '',
        tipoDocumento: 'todos',
        valorMinimo: undefined,
        valorMaximo: undefined,
        proveedor: undefined,
        conArchivo: undefined,
        spaceId: undefined,
        numeroFactura: undefined,
        fechaAnio: undefined,
        fechaMes: undefined,
        fechaDia: undefined,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('ledger_search_filters', JSON.stringify(filters));
  }, [filters]);

  const updateFilter = useCallback(<K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      tipoDocumento: 'todos',
      valorMinimo: undefined,
      valorMaximo: undefined,
      proveedor: undefined,
      conArchivo: undefined,
      spaceId: undefined,
      numeroFactura: undefined,
      fechaAnio: undefined,
      fechaMes: undefined,
      fechaDia: undefined,
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.tipoDocumento !== 'todos' ||
      filters.valorMinimo !== undefined ||
      filters.valorMaximo !== undefined ||
      filters.proveedor !== undefined ||
      filters.conArchivo !== undefined ||
      filters.spaceId !== undefined ||
      filters.numeroFactura !== undefined ||
      filters.fechaAnio !== undefined ||
      filters.fechaMes !== undefined ||
      filters.fechaDia !== undefined
    );
  }, [filters]);

  return { filters, updateFilter, clearFilters, hasActiveFilters };
}
