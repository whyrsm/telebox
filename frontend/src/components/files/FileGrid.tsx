import { memo, DragEvent } from 'react';
import { Folder, Loader2 } from 'lucide-react';
import { cn, formatFileSize, getFileIcon } from '@/lib/utils';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';
import { FILE_ICON_MAP } from '@/lib/constants';
import { useFileItemHandlers } from '@/hooks/useFileItemHandlers';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { MoveToast } from '@/components/ui/MoveToast';

interface FileGridProps {
  files: FileItem[];
  folders: FolderItem[];
  isLoading?: boolean;
  currentFolderId: string | null;
  onFolderOpen: (folder: FolderItem) => void;
  onFileOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileItem | FolderItem, type: 'file' | 'folder') => void;
}

export const FileGrid = memo(function FileGrid({
  files,
  folders,
  isLoading,
  currentFolderId,
  onFolderOpen,
  onFileOpen,
  onContextMenu,
}: FileGridProps) {
  const { selectedItems } = useDriveStore();
  const { handleClick, handleDoubleClick } = useFileItemHandlers(onFolderOpen, onFileOpen);
  const {
    dropTargetId,
    successFlashId,
    lastMoveResult,
    clearMoveResult,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnBackground,
    handleBackgroundDragOver,
  } = useDragAndDrop(currentFolderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  return (
    <div 
      className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1 p-3"
      onDragOver={handleBackgroundDragOver}
      onDrop={handleDropOnBackground}
    >
      {folders.map((folder) => (
        <div
          key={folder.id}
          data-folder-item
          draggable
          className={cn(
            'flex flex-col items-center p-3 rounded cursor-pointer transition-all duration-200',
            'hover:bg-[var(--bg-hover)]',
            selectedItems.has(folder.id) && 'bg-[var(--selected-bg)]',
            dropTargetId === folder.id && 'ring-2 ring-[var(--accent-color)] bg-[var(--bg-hover)]',
            successFlashId === folder.id && 'animate-success-flash'
          )}
          onClick={(e) => handleClick(e, folder, 'folder')}
          onDoubleClick={() => handleDoubleClick(folder, 'folder')}
          onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
          onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, folder, 'folder')}
          onDragEnd={handleDragEnd}
          onDragOver={(e: DragEvent<HTMLDivElement>) => handleDragOver(e, folder)}
          onDragLeave={handleDragLeave}
          onDrop={(e: DragEvent<HTMLDivElement>) => handleDrop(e, folder)}
        >
          <Folder size={40} strokeWidth={1.5} className="text-[var(--text-secondary)] mb-2" />
          <span className="text-xs text-center truncate w-full text-[var(--text-primary)]">{folder.name}</span>
        </div>
      ))}

      {files.map((file) => {
        const iconType = getFileIcon(file.mimeType);
        const Icon = FILE_ICON_MAP[iconType];

        return (
          <div
            key={file.id}
            data-file-item
            draggable
            className={cn(
              'flex flex-col items-center p-3 rounded cursor-pointer transition-colors',
              'hover:bg-[var(--bg-hover)]',
              selectedItems.has(file.id) && 'bg-[var(--selected-bg)]'
            )}
            onClick={(e) => handleClick(e, file, 'file')}
            onDoubleClick={() => handleDoubleClick(file, 'file')}
            onContextMenu={(e) => onContextMenu(e, file, 'file')}
            onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, file, 'file')}
            onDragEnd={handleDragEnd}
          >
            <Icon size={40} strokeWidth={1.5} className="text-[var(--text-secondary)] mb-2" />
            <span className="text-xs text-center truncate w-full text-[var(--text-primary)]">{file.name}</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {formatFileSize(file.size)}
            </span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
          <Folder size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
          <p className="text-sm">This folder is empty</p>
        </div>
      )}

      {lastMoveResult && (
        <MoveToast
          message={`Moved "${lastMoveResult.itemName}" to ${lastMoveResult.targetName}`}
          onClose={clearMoveResult}
        />
      )}
    </div>
  );
});
