import { memo, DragEvent } from 'react';
import { Folder, Loader2, Star } from 'lucide-react';
import { cn, formatFileSize, getFileIcon } from '@/lib/utils';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';
import { FILE_ICON_MAP } from '@/lib/constants';
import { useFileItemHandlers } from '@/hooks/useFileItemHandlers';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { MoveToast } from '@/components/ui/MoveToast';
import { EmptyState } from './EmptyState';

interface FileGridProps {
  files: FileItem[];
  folders: FolderItem[];
  isLoading?: boolean;
  currentFolderId: string | null;
  onFolderOpen: (folder: FolderItem) => void;
  onFileOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, item: FileItem | FolderItem, type: 'file' | 'folder') => void;
  onUpload?: () => void;
  onNewFolder?: () => void;
}

export const FileGrid = memo(function FileGrid({
  files,
  folders,
  isLoading,
  currentFolderId,
  onFolderOpen,
  onFileOpen,
  onContextMenu,
  onUpload,
  onNewFolder,
}: FileGridProps) {
  const { selectedItems, clearSelection } = useDriveStore();
  const { handleClick, handleDoubleClick } = useFileItemHandlers(onFolderOpen, onFileOpen);
  const {
    dragCount,
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

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // Only clear selection if clicking directly on the background, not on items
    const target = e.target as HTMLElement;
    if (!target.closest('[data-file-item]') && !target.closest('[data-folder-item]')) {
      clearSelection();
    }
  };

  return (
    <div 
      className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-1 p-2 sm:p-3 min-h-full content-start"
      onClick={handleBackgroundClick}
      onDragOver={handleBackgroundDragOver}
      onDrop={handleDropOnBackground}
    >
      {folders.map((folder) => (
        <div
          key={folder.id}
          data-folder-item
          draggable
          className={cn(
            'flex flex-col items-center p-2 sm:p-3 rounded cursor-pointer transition-all duration-200 relative',
            'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
            selectedItems.has(folder.id) && 'bg-[var(--selected-bg)]',
            dropTargetId === folder.id && 'ring-2 ring-[var(--accent-color)] bg-[var(--bg-hover)]',
            successFlashId === folder.id && 'animate-success-flash'
          )}
          onClick={(e) => handleClick(e, folder, 'folder')}
          onDoubleClick={() => handleDoubleClick(folder, 'folder')}
          onContextMenu={(e) => onContextMenu(e, folder, 'folder')}
          onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, folder, 'folder', files, folders)}
          onDragEnd={handleDragEnd}
          onDragOver={(e: DragEvent<HTMLDivElement>) => handleDragOver(e, folder)}
          onDragLeave={handleDragLeave}
          onDrop={(e: DragEvent<HTMLDivElement>) => handleDrop(e, folder)}
        >
          {selectedItems.has(folder.id) && dragCount > 1 && (
            <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] bg-[var(--accent-color)] text-white rounded-full">
              {dragCount}
            </span>
          )}
          {folder.isFavorite && (
            <Star size={12} className="absolute top-1 left-1 text-amber-500 fill-amber-500" />
          )}
          <Folder size={32} strokeWidth={1.5} className="sm:w-10 sm:h-10 text-[var(--text-secondary)] mb-1 sm:mb-2" />
          <span className="text-[11px] sm:text-xs text-center truncate w-full text-[var(--text-primary)]">{folder.name}</span>
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
              'flex flex-col items-center p-2 sm:p-3 rounded cursor-pointer transition-colors relative',
              'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
              selectedItems.has(file.id) && 'bg-[var(--selected-bg)]'
            )}
            onClick={(e) => handleClick(e, file, 'file')}
            onDoubleClick={() => handleDoubleClick(file, 'file')}
            onContextMenu={(e) => onContextMenu(e, file, 'file')}
            onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, file, 'file', files, folders)}
            onDragEnd={handleDragEnd}
          >
            {selectedItems.has(file.id) && dragCount > 1 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] bg-[var(--accent-color)] text-white rounded-full">
                {dragCount}
              </span>
            )}
            {file.isFavorite && (
              <Star size={12} className="absolute top-1 left-1 text-amber-500 fill-amber-500" />
            )}
            <Icon size={32} strokeWidth={1.5} className="sm:w-10 sm:h-10 text-[var(--text-secondary)] mb-1 sm:mb-2" />
            <span className="text-[11px] sm:text-xs text-center truncate w-full text-[var(--text-primary)]">{file.name}</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              {formatFileSize(file.size)}
            </span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            isRootFolder={currentFolderId === null}
            onUpload={onUpload || (() => {})}
            onNewFolder={onNewFolder || (() => {})}
          />
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
