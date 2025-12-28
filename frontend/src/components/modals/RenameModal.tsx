import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (name: string) => void;
}

export function RenameModal({ isOpen, currentName, onClose, onRename }: RenameModalProps) {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== currentName) {
      onRename(name.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h2 className="font-medium">Rename</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--hover-bg)] rounded">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className={cn(
                'w-full px-3 py-2 rounded-md',
                'border border-[var(--border-color)]',
                'focus:border-[var(--accent)] focus:outline-none',
                'text-sm'
              )}
            />
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-md hover:bg-[var(--hover-bg)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === currentName}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md',
                'bg-[var(--accent)] text-white',
                'hover:opacity-90 disabled:opacity-50'
              )}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
