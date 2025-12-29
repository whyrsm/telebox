import { memo, DragEvent } from 'react';
import { Folder, Loader2, Star } from 'lucide-react';
import { cn, formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';
import { FILE_ICON_MAP } from '@/lib/constants';
import { useFileItemHandlers } from '@/hooks/useFileItemHandlers';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { MoveToast } from '@/components/ui/MoveToast';
import { EmptyState } from './EmptyState';

interface FileListProps {
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

export const FileList = memo(function FileList({
  files,
  folders,
  isLoading,
  currentFolderId,
  onFolderOpen,
  onFileOpen,
  onContextMenu,
  onUpload,
  onNewFolder,
}: FileListProps) {
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
      className="flex flex-col min-h-full"
      onClick={handleBackgroundClick}
      onDragOver={handleBackgroundDragOver}
      onDrop={handleDropOnBackground}
    >
      <div className="hidden sm:grid grid-cols-[1fr_80px_100px] gap-4 px-4 py-2 text-xs font-medium text-[var(--text-tertiary)] border-b border-[var(--border-color)]">
        <span>Name</span>
        <span>Size</span>
        <span>Modified</span>
      </div>

      {folders.map((folder) => (
        <div
          key={folder.id}
          data-folder-item
          draggable
          className={cn(
            'grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_100px] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-2 cursor-pointer transition-all duration-200',
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
          <div className="flex items-center gap-2 min-w-0">
            <Folder size={16} strokeWidth={2} className="text-[var(--text-secondary)] flex-shrink-0" />
            <span className="truncate text-sm text-[var(--text-primary)]">{folder.name}</span>
            {folder.isFavorite && (
              <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
            {selectedItems.has(folder.id) && dragCount > 1 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[var(--accent-color)] text-white rounded-full">
                {dragCount}
              </span>
            )}
          </div>
          <span className="hidden sm:block text-sm text-[var(--text-tertiary)]">—</span>
          <span className="text-xs sm:text-sm text-[var(--text-tertiary)]">
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
            data-file-item
            draggable
            className={cn(
              'grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_100px] gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-2 cursor-pointer transition-colors',
              'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]',
              selectedItems.has(file.id) && 'bg-[var(--selected-bg)]'
            )}
            onClick={(e) => handleClick(e, file, 'file')}
            onDoubleClick={() => handleDoubleClick(file, 'file')}
            onContextMenu={(e) => onContextMenu(e, file, 'file')}
            onDragStart={(e: DragEvent<HTMLDivElement>) => handleDragStart(e, file, 'file', files, folders)}
            onDragEnd={handleDragEnd}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Icon size={16} strokeWidth={2} className="text-[var(--text-secondary)] flex-shrink-0" />
              <span className="truncate text-sm text-[var(--text-primary)]">{file.name}</span>
              {file.isFavorite && (
                <Star size={12} className="text-amber-500 fill-amber-500 flex-shrink-0" />
              )}
              {selectedItems.has(file.id) && dragCount > 1 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-[var(--accent-color)] text-white rounded-full">
                  {dragCount}
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-[var(--text-tertiary)] sm:block">
              {formatFileSize(file.size)}
            </span>
            <span className="hidden sm:block text-sm text-[var(--text-tertiary)]">
              {formatDate(file.updatedAt)}
            </span>
          </div>
        );
      })}

      {folders.length === 0 && files.length === 0 && (
        <EmptyState
          isRootFolder={currentFolderId === null}
          onUpload={onUpload || (() => {})}
          onNewFolder={onNewFolder || (() => {})}
        />
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
