import React from 'react';
import { Clock, X, Search } from 'lucide-react';
import { RecentSearch } from '../hooks/useSearchFilters';

interface RecentSearchesProps {
  recentSearches: RecentSearch[];
  onRemoveSearch: (id: string) => void;
  onClearAll: () => void;
  onSelectSearch: (search: RecentSearch) => void;
  className?: string;
}

export default function RecentSearches({
  recentSearches,
  onRemoveSearch,
  onClearAll,
  onSelectSearch,
  className = '',
}: RecentSearchesProps) {
  if (recentSearches.length === 0) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'ahora';
    if (seconds < 3600) return `hace ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
    return `hace ${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className={`absolute top-full left-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container-low overflow-hidden z-50 ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-surface-container-low">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-on-surface-variant" />
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Búsquedas recientes</span>
        </div>
        <button
          onClick={onClearAll}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
        >
          Limpiar todo
        </button>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        {recentSearches.map((search) => (
          <div
            key={search.id}
            className="group flex items-center gap-3 p-3 hover:bg-surface-container-low transition-colors cursor-pointer"
            onClick={() => onSelectSearch(search)}
          >
            <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-surface truncate">{search.query}</p>
              {search.filters.tipoDocumento !== 'todos' && (
                <p className="text-xs text-on-surface-variant">
                  {search.filters.tipoDocumento}
                  {search.filters.conArchivo && ' • Con archivo'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-on-surface-variant flex-shrink-0">
                {formatTimeAgo(search.timestamp)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSearch(search.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-container-high rounded transition-all"
              >
                <X className="w-3 h-3 text-on-surface-variant" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
