import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Undo2, X } from 'lucide-react';

interface UndoToastProps {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export default function UndoToast({ message, visible, onUndo, onDismiss }: UndoToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onDismiss, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[100] bg-surface-container-lowest border border-surface-container-low rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-md"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-on-surface">{message}</p>
            <p className="text-xs text-on-surface-variant mt-1">Esta acción se deshacerá automáticamente en 5 segundos</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Deshacer
            </button>
            <button
              onClick={onDismiss}
              className="p-2 hover:bg-surface-container-high rounded-xl text-on-surface-variant transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
