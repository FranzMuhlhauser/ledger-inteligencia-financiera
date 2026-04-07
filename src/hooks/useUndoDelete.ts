import { useState, useCallback } from 'react';

interface UndoDeleteState {
  id: string | null;
  timeout: NodeJS.Timeout | null;
}

export function useUndoDelete() {
  const [pendingDelete, setPendingDelete] = useState<UndoDeleteState>({
    id: null,
    timeout: null,
  });

  const undoDelete = useCallback(() => {
    if (pendingDelete.id && pendingDelete.timeout) {
      clearTimeout(pendingDelete.timeout);
      setPendingDelete({ id: null, timeout: null });
      return pendingDelete.id;
    }
    return null;
  }, [pendingDelete]);

  const scheduleDelete = useCallback(
    (id: string, onConfirm: (id: string) => void) => {
      // Clear any existing timeout
      if (pendingDelete.timeout) {
        clearTimeout(pendingDelete.timeout);
      }

      const timeout = setTimeout(() => {
        onConfirm(id);
        setPendingDelete({ id: null, timeout: null });
      }, 5000);

      setPendingDelete({ id, timeout });
    },
    [pendingDelete]
  );

  const cancelPendingDelete = useCallback(() => {
    if (pendingDelete.timeout) {
      clearTimeout(pendingDelete.timeout);
      setPendingDelete({ id: null, timeout: null });
    }
  }, [pendingDelete]);

  return {
    pendingDeleteId: pendingDelete.id,
    scheduleDelete,
    undoDelete,
    cancelPendingDelete,
  };
}
