import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriveStore, FolderItem } from '@/stores/drive.store';
import { useFolderTree } from '@/lib/queries';
import { NewMenu } from './NewMenu';

interface FolderTreeItemProps {
  folder: FolderItem;
  level: number;
  onSelect: (folder: FolderItem, path: FolderItem[]) => void;
  path: FolderItem[];
}

function FolderTreeItem({ folder, level, onSelect, path }: FolderTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentFolderId = useDriveStore((s) => s.currentFolderId);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = currentFolderId === folder.id;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center py-1 cursor-pointer rounded transition-colors',
          'hover:bg-[var(--bg-hover)]',
          isSelected && 'bg-[var(--selected-bg)]'
        )}
        style={{ paddingLeft: `${8 + level * 16}px`, paddingRight: '8px' }}
        onClick={() => onSelect(folder, [...path, folder])}
      >
        {/* Always reserve space for chevron to keep alignment */}
        <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          {hasChildren && (
            <button
              className="p-0.5 rounded hover:bg-[var(--bg-active)] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? (
                <ChevronDown size={12} strokeWidth={2} className="text-[var(--text-tertiary)]" />
              ) : (
                <ChevronRight size={12} strokeWidth={2} className="text-[var(--text-tertiary)]" />
              )}
            </button>
          )}
        </div>
        <Folder size={14} strokeWidth={2} className="text-[var(--text-secondary)] ml-0.5" />
        <span className="truncate text-sm text-[var(--text-primary)] ml-1.5">{folder.name}</span>
      </div>
      {isOpen && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              onSelect={onSelect}
              path={[...path, folder]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps {
  onNewFolder: () => void;
  onUpload: () => void;
}

export function Sidebar({ onNewFolder, onUpload }: SidebarProps) {
  const { setCurrentFolder, currentFolderId } = useDriveStore();
  const { data: folderTree = [], isLoading } = useFolderTree();

  const handleSelectFolder = (folder: FolderItem, path: FolderItem[]) => {
    setCurrentFolder(folder.id, path);
  };

  const handleGoToRoot = () => {
    setCurrentFolder(null, []);
  };

  return (
    <aside className="w-60 bg-[var(--bg-secondary)] flex flex-col h-full">
      <div className="p-2">
        <NewMenu 
          onNewFolder={onNewFolder}
          onUpload={onUpload}
        />
      </div>

      {/* Separator */}
      <div className="mx-3 border-b border-[var(--border-color)]" />

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors',
            'hover:bg-[var(--bg-hover)]',
            currentFolderId === null && 'bg-[var(--selected-bg)]'
          )}
          onClick={handleGoToRoot}
        >
          <HardDrive size={14} strokeWidth={2} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">My Drive</span>
        </div>

        <div className="mt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : (
            folderTree.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                level={0}
                onSelect={handleSelectFolder}
                path={[]}
              />
            ))
          )}
        </div>
      </nav>
    </aside>
  );
}
