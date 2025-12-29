import { useRef, useCallback, useMemo } from 'react';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';

interface UseFileItemHandlersOptions {
  files: FileItem[];
  folders: FolderItem[];
}

// Detect if device is mobile/touch-enabled
const isMobileDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function useFileItemHandlers(
  onFolderOpen: (folder: FolderItem) => void,
  onFileOpen: (file: FileItem) => void,
  options?: UseFileItemHandlersOptions
) {
  const { toggleSelect, clearSelection, selectedItems, selectAll } = useDriveStore();
  const lastClickedIndexRef = useRef<number | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const lastTapItemRef = useRef<string | null>(null);

  // Combined list: folders first, then files
  const allItems = useMemo(() => {
    return options ? [...options.folders, ...options.files] : [];
  }, [options]);

  const getItemIndex = useCallback((id: string): number => {
    return allItems.findIndex((item) => item.id === id);
  }, [allItems]);

  const selectRange = useCallback((fromIndex: number, toIndex: number) => {
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const idsToSelect = allItems.slice(start, end + 1).map((item) => item.id);
    selectAll(idsToSelect);
  }, [allItems, selectAll]);

  const handleClick = (
    e: React.MouseEvent,
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    const currentIndex = getItemIndex(item.id);
    const isMobile = isMobileDevice();

    // On mobile, implement double-tap to open
    if (isMobile) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      const DOUBLE_TAP_DELAY = 300; // ms

      // Check if this is a double-tap on the same item
      if (
        timeSinceLastTap < DOUBLE_TAP_DELAY &&
        lastTapItemRef.current === item.id
      ) {
        // Double-tap detected - open the item
        e.preventDefault();
        if (type === 'folder') {
          onFolderOpen(item as FolderItem);
        } else {
          onFileOpen(item as FileItem);
        }
        // Reset tap tracking
        lastTapTimeRef.current = 0;
        lastTapItemRef.current = null;
        return;
      }

      // Single tap - select the item
      lastTapTimeRef.current = now;
      lastTapItemRef.current = item.id;
      
      // Single tap replaces selection with this item
      if (selectedItems.size !== 1 || !selectedItems.has(item.id)) {
        clearSelection();
        toggleSelect(item.id);
      }
      lastClickedIndexRef.current = currentIndex;
      return;
    }

    // Desktop behavior
    if (e.shiftKey && lastClickedIndexRef.current !== null && options) {
      // Shift+click: select range from last clicked to current
      e.preventDefault();
      selectRange(lastClickedIndexRef.current, currentIndex);
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click toggles selection
      toggleSelect(item.id);
      lastClickedIndexRef.current = currentIndex;
      return;
    }

    // Single click replaces selection with this item
    // Only clear and re-select if this item isn't the only selected item
    if (selectedItems.size !== 1 || !selectedItems.has(item.id)) {
      clearSelection();
      toggleSelect(item.id);
    }
    lastClickedIndexRef.current = currentIndex;
  };

  const handleDoubleClick = (
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    // Double click opens folders or files (desktop only)
    if (type === 'folder') {
      onFolderOpen(item as FolderItem);
    } else {
      onFileOpen(item as FileItem);
    }
  };

  return { handleClick, handleDoubleClick };
}
