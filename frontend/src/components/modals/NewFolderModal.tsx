import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export function NewFolderModal({ isOpen, onClose, onCreate }: NewFolderModalProps) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h2 className="font-medium">New Folder</h2>
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
              placeholder="Folder name"
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
              disabled={!name.trim()}
              className={cn(
                'px-4 py-1.5 text-sm rounded-md',
                'bg-[var(--accent)] text-white',
                'hover:opacity-90 disabled:opacity-50'
              )}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
