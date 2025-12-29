import { useState, useRef, useEffect } from 'react';
import { Plus, FolderPlus, Upload, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewMenuProps {
  onNewFolder: () => void;
  onUpload: () => void;
}

export function NewMenu({ onNewFolder, onUpload }: NewMenuProps) {
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
    { icon: FolderPlus, label: 'New Folder', onClick: onNewFolder, disabled: false },
    { icon: Upload, label: 'File Upload', onClick: onUpload, disabled: false },
    { icon: Download, label: 'Import from Telegram', onClick: () => {}, disabled: true, badge: 'Coming Soon' },
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* Notion-style button with subtle background */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded',
          'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
          'hover:bg-[var(--bg-active)]',
          'transition-colors text-sm font-medium'
        )}
      >
        <Plus size={16} strokeWidth={2} />
        <span>New</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg p-1 z-50 animate-slideUp shadow-[0_0_0_1px_rgba(15,15,15,0.05),0_3px_6px_rgba(15,15,15,0.1),0_9px_24px_rgba(15,15,15,0.2)]">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick();
                  setIsOpen(false);
                }
              }}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded',
                'transition-colors text-[var(--text-primary)]',
                item.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-[var(--bg-hover)]'
              )}
            >
              <item.icon size={16} strokeWidth={2} className="text-[var(--text-secondary)]" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--text-tertiary)] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
