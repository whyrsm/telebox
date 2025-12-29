import { useRef, useCallback, useMemo } from 'react';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';

interface UseFileItemHandlersOptions {
  files: FileItem[];
  folders: FolderItem[];
}

export function useFileItemHandlers(
  onFolderOpen: (folder: FolderItem) => void,
  onFileOpen: (file: FileItem) => void,
  options?: UseFileItemHandlersOptions
) {
  const { toggleSelect, clearSelection, selectedItems, selectAll } = useDriveStore();
  const lastClickedIndexRef = useRef<number | null>(null);

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _type: 'file' | 'folder'
  ) => {
    const currentIndex = getItemIndex(item.id);

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
    // Double click opens folders or files
    if (type === 'folder') {
      onFolderOpen(item as FolderItem);
    } else {
      onFileOpen(item as FileItem);
    }
  };

  return { handleClick, handleDoubleClick };
}
