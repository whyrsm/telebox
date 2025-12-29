import { useState } from 'react';
import { Plus, FolderPlus, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFABProps {
  onNewFolder: () => void;
  onUpload: () => void;
}

export function MobileFAB({ onNewFolder, onUpload }: MobileFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-40">
      {/* Action buttons */}
      <div
        className={cn(
          'flex flex-col gap-3 mb-3 transition-all duration-200',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <button
          onClick={() => handleAction(onNewFolder)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg text-sm font-medium text-[var(--text-primary)] active:bg-[var(--bg-hover)]"
        >
          <FolderPlus size={18} className="text-[var(--text-secondary)]" />
          New Folder
        </button>
        <button
          onClick={() => handleAction(onUpload)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg text-sm font-medium text-[var(--text-primary)] active:bg-[var(--bg-hover)]"
        >
          <Upload size={18} className="text-[var(--text-secondary)]" />
          Upload
        </button>
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200',
          isOpen
            ? 'bg-[var(--bg-tertiary)] rotate-45'
            : 'bg-[var(--text-primary)] text-white'
        )}
      >
        {isOpen ? (
          <X size={24} className="text-[var(--text-primary)]" />
        ) : (
          <Plus size={24} />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
