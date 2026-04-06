import React from 'react';
import { X, Filter, DollarSign, Building2, Paperclip } from 'lucide-react';
import { SearchPreferences } from '../hooks/useSearchFilters';

interface Space {
  id: string;
  nombre: string;
  icono: string;
  color: string;
}

interface SearchFiltersProps {
  filters: SearchPreferences;
  onUpdateFilter: <K extends keyof SearchPreferences>(key: K, value: SearchPreferences[K]) => void;
  onClearFilters: () => void;
  spaces: Space[];
  resultCount?: number;
}

export default function SearchFilters({
  filters,
  onUpdateFilter,
  onClearFilters,
  spaces,
  resultCount,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasActiveFilters = 
    filters.tipoDocumento !== 'todos' ||
    filters.valorMinimo !== undefined ||
    filters.valorMaximo !== undefined ||
    filters.proveedor !== undefined ||
    filters.conArchivo !== undefined ||
    filters.spaceId !== undefined;

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-surface-container-low overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container-lowest transition-colors"
          >
            <Filter className={`w-4 h-4 ${hasActiveFilters ? 'text-primary' : 'text-on-surface-variant'}`} />
            <span className="text-sm font-bold text-on-surface">Filtros</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
          
          {resultCount !== undefined && (
            <span className="text-sm text-on-surface-variant">
              <strong className="text-on-surface font-bold">{resultCount}</strong> resultado{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-surface-container-low p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Tipo de Documento
            </label>
            <select
              value={filters.tipoDocumento}
              onChange={(e) => onUpdateFilter('tipoDocumento', e.target.value as 'todos' | 'Factura' | 'Boleta')}
              className="w-full bg-surface-container-high/50 border-none rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20"
            >
              <option value="todos">Todos</option>
              <option value="Factura">Factura</option>
              <option value="Boleta">Boleta</option>
            </select>
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Proveedor
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="text"
                value={filters.proveedor || ''}
                onChange={(e) => onUpdateFilter('proveedor', e.target.value || undefined)}
                placeholder="Buscar por proveedor..."
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Espacio */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Espacio
            </label>
            <select
              value={filters.spaceId || ''}
              onChange={(e) => onUpdateFilter('spaceId', e.target.value || undefined)}
              className="w-full bg-surface-container-high/50 border-none rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todos los espacios</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Valor Mínimo */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Valor Mínimo
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="number"
                value={filters.valorMinimo || ''}
                onChange={(e) => onUpdateFilter('valorMinimo', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0"
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Valor Máximo */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Valor Máximo
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
              <input
                type="number"
                value={filters.valorMaximo || ''}
                onChange={(e) => onUpdateFilter('valorMaximo', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Sin límite"
                className="w-full bg-surface-container-high/50 border-none rounded-xl py-2.5 pl-10 pr-3 text-sm focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Con Archivo Adjunto */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant">
              Archivo Adjunto
            </label>
            <button
              onClick={() => onUpdateFilter('conArchivo', filters.conArchivo ? undefined : true)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                filters.conArchivo
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-high/50 text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Paperclip className="w-4 h-4" />
              {filters.conArchivo ? 'Solo con archivos' : 'Todos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
