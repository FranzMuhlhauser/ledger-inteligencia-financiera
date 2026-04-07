import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ledger_saved_proveedores';
const MAX_ITEMS = 80;
/** Mínimo de caracteres para guardar desde el filtro (sugerencias). */
export const MIN_LEN_FILTER_SAVE = 2;
/** id único del <datalist> compartido en la app */
export const LEDGER_SAVED_PROVEEDORES_DATALIST_ID = 'ledger-saved-proveedores';

function loadInitial(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [];
  }
}

/** Une nombres de facturas con la lista guardada (sin duplicar, mismo mínimo de caracteres). */
function mergeUniqueFromInvoices(names: string[], prev: string[]): { next: string[]; added: number } {
  const lowerPrev = new Set(prev.map((p) => p.toLowerCase()));
  const seenInBatch = new Set<string>();
  const toAdd: string[] = [];
  for (const raw of names) {
    const t = raw.trim();
    if (t.length < MIN_LEN_FILTER_SAVE) continue;
    const l = t.toLowerCase();
    if (lowerPrev.has(l) || seenInBatch.has(l)) continue;
    seenInBatch.add(l);
    lowerPrev.add(l);
    toAdd.push(t);
  }
  return { next: [...toAdd, ...prev].slice(0, MAX_ITEMS), added: toAdd.length };
}

/** Cuántos proveedores nuevos se agregarían (útil para mensajes antes de aplicar). */
export function countNewProveedoresForImport(names: string[], existing: string[]): number {
  return mergeUniqueFromInvoices(names, existing).added;
}

export function useSavedProveedores() {
  const [savedProveedores, setSavedProveedores] = useState<string[]>(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProveedores));
  }, [savedProveedores]);

  const addSavedProveedor = useCallback((raw: string) => {
    const t = raw.trim();
    if (t.length < MIN_LEN_FILTER_SAVE) return;

    setSavedProveedores((prev) => {
      const lower = t.toLowerCase();
      const withoutDup = prev.filter((p) => p.toLowerCase() !== lower);
      // Más recientes primero (útil en chips y datalist)
      return [t, ...withoutDup].slice(0, MAX_ITEMS);
    });
  }, []);

  const removeSavedProveedor = useCallback((name: string) => {
    setSavedProveedores((prev) => prev.filter((p) => p !== name));
  }, []);

  const importProveedoresFromInvoices = useCallback((names: string[]) => {
    setSavedProveedores((prev) => mergeUniqueFromInvoices(names, prev).next);
  }, []);

  return { savedProveedores, addSavedProveedor, removeSavedProveedor, importProveedoresFromInvoices };
}
