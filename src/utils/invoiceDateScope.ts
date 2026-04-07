import type { SearchPreferences } from '../hooks/useSearchFilters';

type FechaSlice = Pick<SearchPreferences, 'fechaAnio' | 'fechaMes' | 'fechaDia'>;

/** Hay algún criterio de fecha (rango en Análisis o año/mes/día en filtros). */
export function hasProveedorImportDateScope(
  dateFrom: string,
  dateTo: string,
  sf: FechaSlice
): boolean {
  return Boolean(dateFrom || dateTo || sf.fechaAnio || sf.fechaMes || sf.fechaDia);
}

export function invoiceFechaMatchesDateScope(
  fecha: string,
  dateFrom: string,
  dateTo: string,
  sf: FechaSlice
): boolean {
  if (dateFrom && fecha < dateFrom) return false;
  if (dateTo && fecha > dateTo) return false;
  if (sf.fechaAnio && !fecha.startsWith(sf.fechaAnio)) return false;
  if (sf.fechaMes) {
    const invMonth = fecha.slice(5, 7);
    if (invMonth !== sf.fechaMes) return false;
  }
  if (sf.fechaDia) {
    const invDay = fecha.slice(8, 10);
    const dayFilter = String(sf.fechaDia).padStart(2, '0');
    if (invDay !== dayFilter) return false;
  }
  return true;
}

/** Si no hay criterio de fecha, devuelve todos los ítems; si no, solo los que calzan. */
export function filterByDateScope<T extends { fecha: string }>(
  items: T[],
  dateFrom: string,
  dateTo: string,
  sf: FechaSlice
): T[] {
  if (!hasProveedorImportDateScope(dateFrom, dateTo, sf)) return items;
  return items.filter((inv) => invoiceFechaMatchesDateScope(inv.fecha, dateFrom, dateTo, sf));
}
