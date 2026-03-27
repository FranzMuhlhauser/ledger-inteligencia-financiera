import React from 'react';
import { motion } from 'motion/react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Nueva factura' },
    { keys: ['1'], description: 'Ir a Panel Control' },
    { keys: ['2'], description: 'Ir a Espacios' },
    { keys: ['3'], description: 'Ir a Facturas' },
    { keys: ['4'], description: 'Ir a Análisis' },
    { keys: ['5'], description: 'Ir a Ajustes' },
    { keys: ['/'], description: 'Buscar facturas' },
    { keys: ['?'], description: 'Mostrar esta ayuda' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Keyboard className="text-white w-5 h-5" />
            </div>
            <h2 id="shortcuts-modal-title" className="text-xl font-bold text-on-surface">Atajos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-low rounded-xl transition-colors"
            aria-label="Cerrar modal de atajos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.description} className="flex items-center justify-between">
              <span className="text-on-surface font-medium">{shortcut.description}</span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key, index) => (
                  <React.Fragment key={key}>
                    <kbd className="px-2 py-1.5 bg-surface-container-high rounded-lg text-xs font-mono font-bold text-on-surface border border-surface-container-highest">
                          {key}
                        </kbd>
                    {index < shortcut.keys.length - 1 && (
                      <span className="text-on-surface-variant">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-on-surface-variant mt-6 text-center">
          Presiona <kbd className="px-1.5 py-0.5 bg-surface-container-high rounded text-xs font-mono">?</kbd> en cualquier momento para mostrar esta ayuda
        </p>
      </motion.div>
    </motion.div>
  );
}
