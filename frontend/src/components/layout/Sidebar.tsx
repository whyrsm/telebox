import { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, HardDrive, Loader2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriveStore, FolderItem } from '@/stores/drive.store';
import { useFolderTree, useFavoriteFolders, useFavoriteFiles } from '@/lib/queries';
import { NewMenu } from './NewMenu';
import { StorageIndicator } from './StorageIndicator';
import { ContextMenu } from '../files/ContextMenu';

interface FolderTreeItemProps {
  folder: FolderItem;
  level: number;
  onSelect: (folder: FolderItem, path: FolderItem[]) => void;
  onContextMenu: (e: React.MouseEvent, folder: FolderItem) => void;
  path: FolderItem[];
}

function FolderTreeItem({ folder, level, onSelect, onContextMenu, path }: FolderTreeItemProps) {
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
        onContextMenu={(e) => onContextMenu(e, folder)}
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
              onContextMenu={onContextMenu}
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
  onRenameFolder?: (folder: FolderItem) => void;
  onDeleteFolder?: (folder: FolderItem) => void;
}

interface SidebarContextMenu {
  x: number;
  y: number;
  type: 'folder' | 'background';
  folder?: FolderItem;
}

export function Sidebar({ onNewFolder, onUpload, onRenameFolder, onDeleteFolder }: SidebarProps) {
  const { setCurrentFolder, setCurrentView, currentFolderId, currentView } = useDriveStore();
  const { data: folderTree = [], isLoading } = useFolderTree();
  const { data: favoriteFolders = [] } = useFavoriteFolders();
  const { data: favoriteFiles = [] } = useFavoriteFiles();
  const [contextMenu, setContextMenu] = useState<SidebarContextMenu | null>(null);

  const hasFavorites = favoriteFolders.length > 0 || favoriteFiles.length > 0;

  const handleSelectFolder = (folder: FolderItem, path: FolderItem[]) => {
    setCurrentFolder(folder.id, path);
  };

  const handleGoToRoot = () => {
    setCurrentFolder(null, []);
  };

  const handleGoToFavorites = () => {
    setCurrentView('favorites');
  };

  const handleFolderContextMenu = (e: React.MouseEvent, folder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', folder });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only trigger if clicking on the empty area (not on a folder item)
    const target = e.target as HTMLElement;
    if (target.closest('[data-folder-item]')) return;
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'background' });
  };

  const handleRename = () => {
    if (contextMenu?.folder && onRenameFolder) {
      onRenameFolder(contextMenu.folder);
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (contextMenu?.folder && onDeleteFolder) {
      onDeleteFolder(contextMenu.folder);
    }
    setContextMenu(null);
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

      <nav 
        className="flex-1 overflow-y-auto px-2 py-2"
        onContextMenu={handleBackgroundContextMenu}
      >
        {/* My Drive with nested folders */}
        <div>
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors',
              'hover:bg-[var(--bg-hover)]',
              currentView === 'drive' && currentFolderId === null && 'bg-[var(--selected-bg)]'
            )}
            onClick={handleGoToRoot}
          >
            <HardDrive size={14} strokeWidth={2} className="text-[var(--text-secondary)]" />
            <span className="text-sm font-medium text-[var(--text-primary)]">My Drive</span>
          </div>

          {/* Folder tree nested under My Drive */}
          <div className="ml-2">
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
                  onContextMenu={handleFolderContextMenu}
                  path={[]}
                />
              ))
            )}
          </div>
        </div>

        {hasFavorites && (
          <div
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded transition-colors mt-1',
              'hover:bg-[var(--bg-hover)]',
              currentView === 'favorites' && 'bg-[var(--selected-bg)]'
            )}
            onClick={handleGoToFavorites}
          >
            <Star size={14} strokeWidth={2} className="text-amber-500" />
            <span className="text-sm font-medium text-[var(--text-primary)]">Favorites</span>
          </div>
        )}
      </nav>

      <StorageIndicator />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type === 'folder' ? 'folder' : 'background'}
          isFavorite={contextMenu.folder?.isFavorite}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onNewFolder={() => {
            onNewFolder();
            setContextMenu(null);
          }}
          onUpload={() => {
            onUpload();
            setContextMenu(null);
          }}
        />
      )}
    </aside>
  );
}
