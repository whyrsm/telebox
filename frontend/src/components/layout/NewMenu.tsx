import { useState, useRef, useEffect } from 'react';
import { Plus, FolderPlus, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewMenuProps {
  onNewFolder: () => void;
  onUpload: () => void;
  onImport: () => void;
}

export function NewMenu({ onNewFolder, onUpload, onImport }: NewMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    { icon: FolderPlus, label: 'New Folder', onClick: onNewFolder },
    { icon: Upload, label: 'File Upload', onClick: onUpload },
    { icon: Download, label: 'Import From Telegram', onClick: onImport },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-md',
          'bg-[var(--accent)] text-white',
          'hover:opacity-90 transition-opacity',
          'text-sm font-medium shadow-sm'
        )}
      >
        <Plus size={18} />
        New
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-[var(--border-color)] rounded-md shadow-lg py-1 z-50">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left',
                'hover:bg-[var(--hover-bg)] transition-colors'
              )}
            >
              <item.icon size={18} className="text-[var(--text-secondary)]" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
