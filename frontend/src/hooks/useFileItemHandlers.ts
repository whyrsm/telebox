import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';

export function useFileItemHandlers(
  onFolderOpen: (folder: FolderItem) => void,
  onFileOpen: (file: FileItem) => void
) {
  const { toggleSelect } = useDriveStore();

  const handleClick = (
    e: React.MouseEvent,
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelect(item.id);
      return;
    }

    // Single click opens files (for preview)
    if (type === 'file') {
      onFileOpen(item as FileItem);
    }
  };

  const handleDoubleClick = (
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    // Double click opens folders
    if (type === 'folder') {
      onFolderOpen(item as FolderItem);
    }
  };

  return { handleClick, handleDoubleClick };
}
