import { useState } from 'react';
import { Trash2, RotateCcw, Loader2, Folder, AlertTriangle } from 'lucide-react';
import { cn, formatFileSize, formatDate, getFileIcon } from '@/lib/utils';
import { FILE_ICON_MAP } from '@/lib/constants';
import { useTrashedFiles, useTrashedFolders, useRestoreFile, useRestoreFolder, usePermanentDeleteFile, usePermanentDeleteFolder, useEmptyTrash } from '@/lib/queries';
import type { FileItem, FolderItem } from '@/stores/drive.store';

interface TrashItemProps {
  item: FileItem | FolderItem;
  type: 'file' | 'folder';
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

function TrashItem({ item, type, isSelected, onSelect, onRestore, onPermanentDelete }: TrashItemProps) {
  const isFile = type === 'file';
  const fileItem = item as FileItem;
  const iconType = isFile ? getFileIcon(fileItem.mimeType) : 'folder';
  const Icon = isFile ? FILE_ICON_MAP[iconType] : Folder;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 hover:bg-[var(--bg-hover)] cursor-pointer border-b border-[var(--border-color)]',
        isSelected && 'bg-[var(--selected-bg)]'
      )}
      onClick={onSelect}
    >
      <div className="flex-shrink-0">
        <Icon size={20} className="text-[var(--text-secondary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)] truncate">{item.name}</p>
        <p className="text-xs text-[var(--text-tertiary)]">
          {isFile && `${formatFileSize(fileItem.size)} • `}
          Deleted {formatDate(item.updatedAt)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onRestore(); }}
          className="p-1.5 rounded hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          title="Restore"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onPermanentDelete(); }}
          className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-500"
          title="Delete permanently"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export function TrashView() {
  const { data: trashedFiles = [], isLoading: filesLoading } = useTrashedFiles();
  const { data: trashedFolders = [], isLoading: foldersLoading } = useTrashedFolders();
  const restoreFile = useRestoreFile();
  const restoreFolder = useRestoreFolder();
  const permanentDeleteFile = usePermanentDeleteFile();
  const permanentDeleteFolder = usePermanentDeleteFolder();
  const emptyTrash = useEmptyTrash();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const isLoading = filesLoading || foldersLoading;
  const isEmpty = trashedFiles.length === 0 && trashedFolders.length === 0;
  const isEmptying = emptyTrash.isPending;

  const handleEmptyTrash = () => {
    emptyTrash.mutate();
    setShowEmptyConfirm(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
        <Trash2 size={48} strokeWidth={1.5} className="mb-4" />
        <p className="text-lg font-medium">Trash is empty</p>
        <p className="text-sm mt-1">Items you delete will appear here</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Trash2 size={20} className="text-red-500" />
          <span className="font-medium text-[var(--text-primary)]">Trash</span>
          <span className="text-sm text-[var(--text-tertiary)]">
            ({trashedFolders.length + trashedFiles.length} items)
          </span>
        </div>
        <button
          onClick={() => setShowEmptyConfirm(true)}
          disabled={isEmptying}
          className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
        >
          {isEmptying ? 'Emptying...' : 'Empty trash'}
        </button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto">
        {trashedFolders.map((folder) => (
          <TrashItem
            key={folder.id}
            item={folder}
            type="folder"
            isSelected={selectedId === folder.id}
            onSelect={() => setSelectedId(folder.id)}
            onRestore={() => restoreFolder.mutate(folder.id)}
            onPermanentDelete={() => permanentDeleteFolder.mutate(folder.id)}
          />
        ))}
        {trashedFiles.map((file) => (
          <TrashItem
            key={file.id}
            item={file}
            type="file"
            isSelected={selectedId === file.id}
            onSelect={() => setSelectedId(file.id)}
            onRestore={() => restoreFile.mutate(file.id)}
            onPermanentDelete={() => permanentDeleteFile.mutate(file.id)}
          />
        ))}
      </div>

      {/* Empty trash confirmation modal */}
      {showEmptyConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-primary)] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-full">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Empty trash?</h3>
            </div>
            <p className="text-[var(--text-secondary)] mb-6">
              All {trashedFolders.length + trashedFiles.length} items in trash will be permanently deleted. 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowEmptyConfirm(false)}
                className="px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 rounded transition-colors"
              >
                Empty trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
