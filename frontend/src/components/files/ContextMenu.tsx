import { Download, Pencil, Trash2, FolderPlus, Upload, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'file' | 'folder' | 'background';
  isFavorite?: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onRename: () => void;
  onDelete: () => void;
  onToggleFavorite?: () => void;
  onNewFolder?: () => void;
  onUpload?: () => void;
}

export function ContextMenu({
  x,
  y,
  type,
  isFavorite,
  onClose,
  onDownload,
  onRename,
  onDelete,
  onToggleFavorite,
  onNewFolder,
  onUpload,
}: ContextMenuProps) {
  const menuItems = type === 'background' 
    ? [
        { icon: FolderPlus, label: 'New Folder', onClick: onNewFolder || (() => {}) },
        { icon: Upload, label: 'Upload Files', onClick: onUpload || (() => {}) },
      ]
    : [
        ...(type === 'file' && onDownload
          ? [{ icon: Download, label: 'Download', onClick: onDownload }]
          : []),
        ...(onToggleFavorite
          ? [{ icon: Star, label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites', onClick: onToggleFavorite, highlight: isFavorite }]
          : []),
        { icon: Pencil, label: 'Rename', onClick: onRename },
        { icon: Trash2, label: 'Delete', onClick: onDelete, danger: true },
      ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white rounded-lg p-1 min-w-[160px] animate-slideUp shadow-[0_0_0_1px_rgba(15,15,15,0.05),0_3px_6px_rgba(15,15,15,0.1),0_9px_24px_rgba(15,15,15,0.2)]"
        style={{ left: x, top: y }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded',
              'hover:bg-[var(--bg-hover)] transition-colors',
              item.danger ? 'text-[#dc2626]' : 'text-[var(--text-primary)]'
            )}
          >
            <item.icon 
              size={14} 
              strokeWidth={2} 
              className={cn(
                item.danger ? '' : 'text-[var(--text-secondary)]',
                'highlight' in item && item.highlight && 'text-amber-500 fill-amber-500'
              )} 
            />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
