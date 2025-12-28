import {
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { cn, formatFileSize, getFileIcon } from '@/lib/utils';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';

const iconMap: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  archive: Archive,
  doc: FileText,
  sheet: FileSpreadsheet,
  file: File,
};

interface FileGridProps {
  files: FileItem[];
  folders: FolderItem[];
  isLoading?: boolean;
  onFolderOpen: (folder: FolderItem) => void;
  onFileOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileItem | FolderItem, type: 'file' | 'folder') => void;
}

export function FileGrid({
  files,
  folders,
  isLoading,
  onFolderOpen,
  onFileOpen,
  onContextMenu,
}: FileGridProps) {
  const { selectedItems, toggleSelect } = useDriveStore();

  const handleClick = (e: React.MouseEvent, id: string) => {
    if (e.ctrlKey || e.metaKey) {
      toggleSelect(id);
    }
  };

  const handleDoubleClick = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    if (type === 'folder') {
      onFolderOpen(item as FolderItem);
    } else {
      onFileOpen(item as FileItem);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 p-4">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={cn(
            'flex flex-col items-center p-3 rounded cursor-pointer',
            'hover:bg-[var(--hover-bg)]',
            selectedItems.has(folder.id) && 'bg-[var(--selected-bg)]'
          )}
          onClick={(e) => handleClick(e, folder.id)}
          onDoubleClick={() => handleDoubleClick(folder, 'folder')}
          onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
        >
          <Folder size={48} className="text-[var(--accent)] mb-2" />
          <span className="text-xs text-center truncate w-full">{folder.name}</span>
        </div>
      ))}

      {files.map((file) => {
        const iconType = getFileIcon(file.mimeType);
        const Icon = iconMap[iconType] || File;

        return (
          <div
            key={file.id}
            className={cn(
              'flex flex-col items-center p-3 rounded cursor-pointer',
              'hover:bg-[var(--hover-bg)]',
              selectedItems.has(file.id) && 'bg-[var(--selected-bg)]'
            )}
            onClick={(e) => handleClick(e, file.id)}
            onDoubleClick={() => handleDoubleClick(file, 'file')}
            onContextMenu={(e) => onContextMenu(e, file, 'file')}
          >
            <Icon size={48} className="text-[var(--text-secondary)] mb-2" />
            <span className="text-xs text-center truncate w-full">{file.name}</span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              {formatFileSize(file.size)}
            </span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
          <Folder size={48} className="mb-2 opacity-50" />
          <p>This folder is empty</p>
        </div>
      )}
    </div>
  );
}
