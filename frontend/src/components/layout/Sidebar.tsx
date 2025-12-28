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
          'flex items-center gap-1 px-2 py-1 cursor-pointer rounded',
          'hover:bg-[var(--hover-bg)]',
          isSelected && 'bg-[var(--selected-bg)]'
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(folder, [...path, folder])}
      >
        <button
          className="p-0.5 hover:bg-[var(--border-color)] rounded"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-[14px]" />
          )}
        </button>
        <Folder size={16} className="text-[var(--accent)]" />
        <span className="truncate text-sm">{folder.name}</span>
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
  onImport: () => void;
}

export function Sidebar({ onNewFolder, onUpload, onImport }: SidebarProps) {
  const { setCurrentFolder, currentFolderId } = useDriveStore();
  const { data: folderTree = [], isLoading } = useFolderTree();

  const handleSelectFolder = (folder: FolderItem, path: FolderItem[]) => {
    setCurrentFolder(folder.id, path);
  };

  const handleGoToRoot = () => {
    setCurrentFolder(null, []);
  };

  return (
    <aside className="w-56 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col h-full">
      <div className="p-3">
        <NewMenu 
          onNewFolder={onNewFolder}
          onUpload={onUpload}
          onImport={onImport}
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded',
            'hover:bg-[var(--hover-bg)]',
            currentFolderId === null && 'bg-[var(--selected-bg)]'
          )}
          onClick={handleGoToRoot}
        >
          <HardDrive size={16} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-medium">My Drive</span>
        </div>

        <div className="mt-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
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
