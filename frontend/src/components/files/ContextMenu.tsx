import { Download, Pencil, Trash2, FolderInput, FolderPlus, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContextMenuProps {
  x: number;
  y: number;
  type: 'file' | 'folder' | 'background';
  onClose: () => void;
  onDownload?: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
  onNewFolder?: () => void;
  onUpload?: () => void;
}

export function ContextMenu({
  x,
  y,
  type,
  onClose,
  onDownload,
  onRename,
  onMove,
  onDelete,
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
        { icon: Pencil, label: 'Rename', onClick: onRename },
        { icon: FolderInput, label: 'Move to...', onClick: onMove },
        { icon: Trash2, label: 'Delete', onClick: onDelete, danger: true },
      ];

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-[var(--border-color)] rounded-md shadow-lg py-1 min-w-[160px]"
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
              'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left',
              'hover:bg-[var(--hover-bg)]',
              item.danger && 'text-red-600'
            )}
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
