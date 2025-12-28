import { Folder, Loader2 } from 'lucide-react';
import { cn, formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';
import { FILE_ICON_MAP } from '@/lib/constants';
import { useFileItemHandlers } from '@/hooks/useFileItemHandlers';

interface FileListProps {
  files: FileItem[];
  folders: FolderItem[];
  isLoading?: boolean;
  onFolderOpen: (folder: FolderItem) => void;
  onFileOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileItem | FolderItem, type: 'file' | 'folder') => void;
}

export function FileList({
  files,
  folders,
  isLoading,
  onFolderOpen,
  onFileOpen,
  onContextMenu,
}: FileListProps) {
  const { selectedItems } = useDriveStore();
  const { handleClick, handleDoubleClick } = useFileItemHandlers(onFolderOpen, onFileOpen);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-[1fr_100px_120px] gap-4 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <span>Name</span>
        <span>Size</span>
        <span>Modified</span>
      </div>

      {folders.map((folder) => (
        <div
          key={folder.id}
          className={cn(
            'grid grid-cols-[1fr_100px_120px] gap-4 px-4 py-2 cursor-pointer',
            'hover:bg-[var(--hover-bg)] border-b border-[var(--border-color)]',
            selectedItems.has(folder.id) && 'bg-[var(--selected-bg)]'
          )}
          onClick={(e) => handleClick(e, folder, 'folder')}
          onDoubleClick={() => handleDoubleClick(folder, 'folder')}
          onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Folder size={18} className="text-[var(--accent)] flex-shrink-0" />
            <span className="truncate text-sm">{folder.name}</span>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">—</span>
          <span className="text-sm text-[var(--text-secondary)]">
            {formatDate(folder.updatedAt)}
          </span>
        </div>
      ))}

      {files.map((file) => {
        const iconType = getFileIcon(file.mimeType);
        const Icon = FILE_ICON_MAP[iconType];

        return (
          <div
            key={file.id}
            className={cn(
              'grid grid-cols-[1fr_100px_120px] gap-4 px-4 py-2 cursor-pointer',
              'hover:bg-[var(--hover-bg)] border-b border-[var(--border-color)]',
              selectedItems.has(file.id) && 'bg-[var(--selected-bg)]'
            )}
            onClick={(e) => handleClick(e, file, 'file')}
            onDoubleClick={() => handleDoubleClick(file, 'file')}
            onContextMenu={(e) => onContextMenu(e, file, 'file')}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon size={18} className="text-[var(--text-secondary)] flex-shrink-0" />
              <span className="truncate text-sm">{file.name}</span>
            </div>
            <span className="text-sm text-[var(--text-secondary)]">
              {formatFileSize(file.size)}
            </span>
            <span className="text-sm text-[var(--text-secondary)]">
              {formatDate(file.updatedAt)}
            </span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
          <Folder size={48} className="mb-2 opacity-50" />
          <p>This folder is empty</p>
        </div>
      )}
    </div>
  );
}
