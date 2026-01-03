import { useState } from 'react';
import { X, Folder, ChevronRight, ChevronDown, HardDrive, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFolderTree } from '@/lib/queries';
import { FolderItem } from '@/stores/drive.store';

interface MoveToModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetFolderId: string | null) => void;
  itemCount: number;
  itemType: 'file' | 'folder' | 'mixed';
  excludeFolderIds?: string[];
  isLoading?: boolean;
}

interface FolderTreeItemProps {
  folder: FolderItem;
  level: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  excludeIds: string[];
}

function FolderTreeItem({ folder, level, selectedId, onSelect, excludeIds }: FolderTreeItemProps) {
  const [isOpen, setIsOpen] = useState(true); // Default to open so nested folders are visible
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;
  const isExcluded = excludeIds.includes(folder.id);

  if (isExcluded) return null;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center py-2 cursor-pointer rounded-lg mx-2 transition-colors',
          'hover:bg-[var(--bg-hover)]',
          isSelected && 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]'
        )}
        style={{ paddingLeft: `${8 + level * 20}px`, paddingRight: '8px' }}
        onClick={() => onSelect(folder.id)}
      >
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1">
          {hasChildren && (
            <button
              className={cn(
                'p-0.5 rounded transition-colors',
                isSelected ? 'hover:bg-white/20' : 'hover:bg-[var(--bg-active)]'
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? (
                <ChevronDown size={14} strokeWidth={2} className={isSelected ? 'text-white' : 'text-[var(--text-tertiary)]'} />
              ) : (
                <ChevronRight size={14} strokeWidth={2} className={isSelected ? 'text-white' : 'text-[var(--text-tertiary)]'} />
              )}
            </button>
          )}
        </div>
        <Folder size={16} strokeWidth={2} className={isSelected ? 'text-white' : 'text-[var(--text-secondary)]'} />
        <span className={cn('truncate text-sm ml-2', isSelected ? 'text-white font-medium' : 'text-[var(--text-primary)]')}>
          {folder.name}
        </span>
      </div>
      {isOpen && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              excludeIds={excludeIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function MoveToModal({
  isOpen,
  onClose,
  onMove,
  itemCount,
  itemType,
  excludeFolderIds = [],
  isLoading = false,
}: MoveToModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { data: folderTree = [], isLoading: isLoadingTree } = useFolderTree();

  if (!isOpen) return null;

  const getItemLabel = () => {
    if (itemCount === 1) {
      return itemType === 'file' ? '1 file' : itemType === 'folder' ? '1 folder' : '1 item';
    }
    return itemType === 'file'
      ? `${itemCount} files`
      : itemType === 'folder'
        ? `${itemCount} folders`
        : `${itemCount} items`;
  };

  const handleMove = () => {
    onMove(selectedFolderId);
  };

  // Recursively filter out excluded folders from the entire tree
  const filterFolderTree = (folders: FolderItem[]): FolderItem[] => {
    return folders
      .filter(f => !excludeFolderIds.includes(f.id))
      .map(folder => ({
        ...folder,
        children: folder.children ? filterFolderTree(folder.children) : undefined
      }));
  };

  const filteredTree = filterFolderTree(folderTree);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Move {getItemLabel()}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors text-[var(--text-secondary)]"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Folder tree */}
          <div className="max-h-96 overflow-y-auto py-2">
            {isLoadingTree ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--text-tertiary)]" />
              </div>
            ) : (
              <>
                {/* My Drive (root) option */}
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 cursor-pointer rounded-lg mx-2 transition-colors',
                    'hover:bg-[var(--bg-hover)]',
                    selectedFolderId === null && 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]'
                  )}
                  onClick={() => setSelectedFolderId(null)}
                >
                  <HardDrive size={16} strokeWidth={2} className={selectedFolderId === null ? 'text-white' : 'text-[var(--text-secondary)]'} />
                  <span className={cn('text-sm font-medium', selectedFolderId === null ? 'text-white' : 'text-[var(--text-primary)]')}>
                    My Drive
                  </span>
                </div>

                {/* Folder tree */}
                {filteredTree.length > 0 && (
                  <div className="mt-1">
                    {filteredTree.map((folder) => (
                      <FolderTreeItem
                        key={folder.id}
                        folder={folder}
                        level={0}
                        selectedId={selectedFolderId}
                        onSelect={setSelectedFolderId}
                        excludeIds={excludeFolderIds}
                      />
                    ))}
                  </div>
                )}

                {filteredTree.length === 0 && (
                  <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
                    No folders available
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={isLoading}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)]',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center gap-2'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Moving...</span>
                </>
              ) : (
                'Move here'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
