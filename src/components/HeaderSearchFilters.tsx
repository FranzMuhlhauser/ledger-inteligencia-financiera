import React from 'react';
import { Calendar, Check, Hash, X } from 'lucide-react';
import { SearchPreferences } from '../hooks/useSearchFilters';
import ProveedorFilterField from './ProveedorFilterField';

interface Space {
  id: string;
  nombre: string;
}

interface HeaderSearchFiltersProps {
  filters: SearchPreferences;
  onUpdateFilter: <K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => void;
  onClearStructured: () => void;
  spaces: Space[];
  savedProveedores: string[];
  onCommitProveedor: (raw: string) => void;
  onRemoveSavedProveedor: (name: string) => void;
  onImportProveedoresFromInvoices: () => void;
  importProveedoresDisabled: boolean;
  importProveedoresTitle: string;
  onApplyFilters: () => void;
}

export default function HeaderSearchFilters({
  filters,
  onUpdateFilter,
  onClearStructured,
  spaces,
  savedProveedores,
  onCommitProveedor,
  onRemoveSavedProveedor,
  onImportProveedoresFromInvoices,
  importProveedoresDisabled,
  importProveedoresTitle,
  onApplyFilters,
}: HeaderSearchFiltersProps) {
  const headerActive =
    filters.tipoDocumento !== 'todos' ||
    !!filters.proveedor ||
    !!filters.spaceId ||
    !!filters.numeroFactura ||
    !!filters.fechaAnio ||
    !!filters.fechaMes ||
    !!filters.fechaDia;

  return (
    <div
      className="absolute top-full left-0 right-0 mt-2 p-4 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-low z-50 max-h-[min(70vh,32rem)] overflow-y-auto"
      role="dialog"
      aria-label="Filtros de búsqueda"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-bold text-on-surface">Filtros</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Combiná varios criterios para acotar facturas y boletas. «Importar desde facturas» usa el rango de fechas de
            Análisis y/o año, mes y día de aquí.
          </p>
        </div>
        {headerActive && (
          <button
            type="button"
            onClick={() => {
              onClearStructured();
            }}
            className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Tipo
          </label>
          <select
            value={filters.tipoDocumento}
            onChange={(e) => onUpdateFilter('tipoDocumento', e.target.value as 'todos' | 'Factura' | 'Boleta')}
            className="w-full bg-surface-container-low border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Facturas y boletas</option>
            <option value="Factura">Solo facturas</option>
            <option value="Boleta">Solo boletas</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Espacio
          </label>
          <select
            value={filters.spaceId || ''}
            onChange={(e) => onUpdateFilter('spaceId', e.target.value || undefined)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todos</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>
                {space.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Proveedor
            </label>
            <button
              type="button"
              disabled={importProveedoresDisabled}
              onClick={onImportProveedoresFromInvoices}
              className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed shrink-0"
              title={importProveedoresTitle}
            >
              Importar desde facturas
            </button>
          </div>
          <ProveedorFilterField
            value={filters.proveedor || ''}
            onValueChange={(v) => onUpdateFilter('proveedor', v)}
            savedProveedores={savedProveedores}
            onCommitProvider={onCommitProveedor}
            onRemoveSaved={onRemoveSavedProveedor}
            inputClassName="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20"
            chipsClassName="max-h-28 overflow-y-auto"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Nº factura o boleta
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
            <input
              type="text"
              value={filters.numeroFactura || ''}
              onChange={(e) => onUpdateFilter('numeroFactura', e.target.value || undefined)}
              placeholder="Ej. F-1234"
              className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Año
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
            <input
              type="number"
              value={filters.fechaAnio || ''}
              onChange={(e) => onUpdateFilter('fechaAnio', e.target.value || undefined)}
              placeholder="2024"
              min={2000}
              max={2099}
              className="w-full bg-surface-container-low border-none rounded-xl py-2 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Mes
          </label>
          <select
            value={filters.fechaMes || ''}
            onChange={(e) => onUpdateFilter('fechaMes', e.target.value || undefined)}
            className="w-full bg-surface-container-low border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Cualquiera</option>
            <option value="01">Enero</option>
            <option value="02">Febrero</option>
            <option value="03">Marzo</option>
            <option value="04">Abril</option>
            <option value="05">Mayo</option>
            <option value="06">Junio</option>
            <option value="07">Julio</option>
            <option value="08">Agosto</option>
            <option value="09">Septiembre</option>
            <option value="10">Octubre</option>
            <option value="11">Noviembre</option>
            <option value="12">Diciembre</option>
          </select>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
            Día
          </label>
          <input
            type="number"
            value={filters.fechaDia || ''}
            onChange={(e) => onUpdateFilter('fechaDia', e.target.value || undefined)}
            placeholder="1–31"
            min={1}
            max={31}
            className="w-full bg-surface-container-low border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-surface-container-low flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onApplyFilters}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Check className="w-4 h-4" aria-hidden />
          Listo — ver resultados
        </button>
      </div>
    </div>
  );
}
