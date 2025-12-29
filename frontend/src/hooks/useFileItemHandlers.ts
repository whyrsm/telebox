import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';

export function useFileItemHandlers(
  onFolderOpen: (folder: FolderItem) => void,
  onFileOpen: (file: FileItem) => void
) {
  const { toggleSelect, clearSelection, selectedItems } = useDriveStore();

  const handleClick = (
    e: React.MouseEvent,
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click toggles selection
      toggleSelect(item.id);
      return;
    }

    // Single click replaces selection with this item
    // Only clear and re-select if this item isn't the only selected item
    if (selectedItems.size !== 1 || !selectedItems.has(item.id)) {
      clearSelection();
      toggleSelect(item.id);
    }
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
