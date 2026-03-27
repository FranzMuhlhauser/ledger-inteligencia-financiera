import { useEffect, useCallback, RefObject } from 'react';

interface KeyboardShortcut {
  key: string;
  callback: (event: KeyboardEvent) => void;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
}

/**
 * Hook para registrar atajos de teclado globales
 * @param shortcuts - Array de atajos de teclado
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : true;
        const shiftMatches = shortcut.shift ? event.shiftKey : true;
        const altMatches = shortcut.alt ? event.altKey : true;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.callback(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/**
 * Hook para focus en elementos con atajos de teclado
 * @param ref - Ref del elemento
 * @param shortcutKey - Tecla para activar el focus
 */
export function useKeyboardFocus(
  ref: RefObject<HTMLElement | null>,
  shortcutKey: string
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === shortcutKey.toLowerCase() && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        ref.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [ref, shortcutKey]);
}
