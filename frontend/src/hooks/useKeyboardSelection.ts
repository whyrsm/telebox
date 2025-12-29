import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';

interface UseKeyboardSelectionOptions {
  files: FileItem[];
  folders: FolderItem[];
  onFolderOpen: (folder: FolderItem) => void;
  onFileOpen: (file: FileItem) => void;
  enabled?: boolean;
}

export function useKeyboardSelection({
  files,
  folders,
  onFolderOpen,
  onFileOpen,
  enabled = true,
}: UseKeyboardSelectionOptions) {
  const { selectedItems, toggleSelect, selectAll, clearSelection } = useDriveStore();
  const anchorIndexRef = useRef<number | null>(null);

  // Combined list: folders first, then files
  const allItems = useMemo(() => [...folders, ...files], [folders, files]);

  const getItemIndex = useCallback((id: string): number => {
    return allItems.findIndex((item) => item.id === id);
  }, [allItems]);

  const getLastSelectedIndex = useCallback((): number => {
    if (selectedItems.size === 0) return -1;
    
    // Find the last selected item in the list order
    let lastIndex = -1;
    selectedItems.forEach((id) => {
      const index = getItemIndex(id);
      if (index > lastIndex) lastIndex = index;
    });
    return lastIndex;
  }, [selectedItems, getItemIndex]);

  const getFirstSelectedIndex = useCallback((): number => {
    if (selectedItems.size === 0) return -1;
    
    let firstIndex = allItems.length;
    selectedItems.forEach((id) => {
      const index = getItemIndex(id);
      if (index !== -1 && index < firstIndex) firstIndex = index;
    });
    return firstIndex === allItems.length ? -1 : firstIndex;
  }, [selectedItems, getItemIndex, allItems.length]);

  const selectRange = useCallback((fromIndex: number, toIndex: number) => {
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const idsToSelect = allItems.slice(start, end + 1).map((item) => item.id);
    selectAll(idsToSelect);
  }, [allItems, selectAll]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || allItems.length === 0) return;

    // Don't handle if focus is on input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const isShift = e.shiftKey;
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // Handle Ctrl/Cmd+A for select all
    if (isCtrlOrCmd && e.key === 'a') {
      e.preventDefault();
      selectAll(allItems.map((item) => item.id));
      return;
    }

    // Handle Enter to open selected item
    if (e.key === 'Enter' && selectedItems.size === 1) {
      e.preventDefault();
      const selectedId = Array.from(selectedItems)[0];
      const folderIndex = folders.findIndex((f) => f.id === selectedId);
      if (folderIndex !== -1) {
        onFolderOpen(folders[folderIndex]);
      } else {
        const file = files.find((f) => f.id === selectedId);
        if (file) onFileOpen(file);
      }
      return;
    }

    // Handle Escape to clear selection
    if (e.key === 'Escape') {
      e.preventDefault();
      clearSelection();
      anchorIndexRef.current = null;
      return;
    }

    // Arrow key navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();

      const currentIndex = getLastSelectedIndex();
      let newIndex: number;

      // Determine direction based on key
      const isForward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
      const delta = isForward ? 1 : -1;

      if (currentIndex === -1) {
        // No selection, start from beginning or end
        newIndex = isForward ? 0 : allItems.length - 1;
      } else {
        newIndex = currentIndex + delta;
      }

      // Clamp to valid range
      newIndex = Math.max(0, Math.min(allItems.length - 1, newIndex));

      if (isShift) {
        // Shift+Arrow: extend selection
        if (anchorIndexRef.current === null) {
          // Set anchor to current selection start
          anchorIndexRef.current = currentIndex === -1 ? newIndex : getFirstSelectedIndex();
        }
        selectRange(anchorIndexRef.current, newIndex);
      } else {
        // Regular arrow: move selection
        clearSelection();
        toggleSelect(allItems[newIndex].id);
        anchorIndexRef.current = newIndex;
      }
    }
  }, [
    enabled,
    allItems,
    selectedItems,
    folders,
    files,
    selectAll,
    clearSelection,
    toggleSelect,
    getLastSelectedIndex,
    getFirstSelectedIndex,
    selectRange,
    onFolderOpen,
    onFileOpen,
  ]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  // Reset anchor when selection is cleared externally
  useEffect(() => {
    if (selectedItems.size === 0) {
      anchorIndexRef.current = null;
    }
  }, [selectedItems.size]);
}
