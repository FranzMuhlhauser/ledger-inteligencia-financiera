import React from 'react';
import { Building2, X } from 'lucide-react';
import { LEDGER_SAVED_PROVEEDORES_DATALIST_ID } from '../hooks/useSavedProveedores';

interface ProveedorFilterFieldProps {
  value: string;
  onValueChange: (next: string | undefined) => void;
  savedProveedores: string[];
  onCommitProvider: (raw: string) => void;
  onRemoveSaved: (name: string) => void;
  placeholder?: string;
  labelClassName?: string;
  /** Clases del input (sin el icono) */
  inputClassName: string;
  /** Si true, muestra fila de chips debajo */
  showSavedChips?: boolean;
  chipsClassName?: string;
  /** Texto sobre los chips; vacío = no mostrar línea de ayuda */
  savedHint?: string;
}

export default function ProveedorFilterField({
  value,
  onValueChange,
  savedProveedores,
  onCommitProvider,
  onRemoveSaved,
  placeholder = 'Nombre o parte del proveedor…',
  labelClassName = 'text-[10px] uppercase tracking-[0.15em] font-bold text-on-surface-variant',
  inputClassName,
  showSavedChips = true,
  chipsClassName = 'max-h-24 overflow-y-auto',
  savedHint = 'Guardados — tocá para usar, ✕ para borrar de la lista',
}: ProveedorFilterFieldProps) {
  return (
    <>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4 pointer-events-none" />
        <input
          type="text"
          list={LEDGER_SAVED_PROVEEDORES_DATALIST_ID}
          value={value}
          onChange={(e) => onValueChange(e.target.value || undefined)}
          onBlur={(e) => onCommitProvider(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClassName}
        />
      </div>
      {showSavedChips && savedProveedores.length > 0 && (
        <div className={`mt-2 space-y-1.5 ${chipsClassName}`}>
          {savedHint ? (
            <p className={`${labelClassName} normal-case tracking-normal text-[11px]`}>{savedHint}</p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {savedProveedores.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-0.5 max-w-full rounded-lg bg-surface-container-high/80 pl-2 pr-1 py-0.5 text-xs text-on-surface"
              >
                <button
                  type="button"
                  className="truncate max-w-[200px] text-left font-medium hover:text-primary transition-colors"
                  onClick={() => onValueChange(p)}
                >
                  {p}
                </button>
                <button
                  type="button"
                  className="p-0.5 rounded-md text-on-surface-variant hover:bg-rose-100 hover:text-rose-600 shrink-0"
                  aria-label={`Eliminar ${p} de la lista guardada`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onRemoveSaved(p)}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
