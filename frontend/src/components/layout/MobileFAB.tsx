import { useState } from 'react';
import { Plus, FolderPlus, Upload, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFABProps {
  onNewFolder: () => void;
  onUpload: () => void;
  onImport?: () => void;
}

export function MobileFAB({ onNewFolder, onUpload, onImport }: MobileFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center">
      {/* Action buttons */}
      <div
        className={cn(
          'flex flex-col gap-3 mb-3 transition-all duration-200',
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <button
          onClick={() => handleAction(onNewFolder)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg text-sm font-medium text-gray-900 active:bg-gray-100"
        >
          <FolderPlus size={18} className="text-gray-600" />
          New Folder
        </button>
        <button
          onClick={() => handleAction(onUpload)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg text-sm font-medium text-gray-900 active:bg-gray-100"
        >
          <Upload size={18} className="text-gray-600" />
          Upload
        </button>
        {onImport && (
          <button
            onClick={() => handleAction(onImport)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full shadow-lg text-sm font-medium text-gray-900 active:bg-gray-100"
          >
            <Download size={18} className="text-gray-600" />
            Import
          </button>
        )}
      </div>

      {/* Main FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.opacity = '0.85';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200',
          isOpen
            ? 'bg-white rotate-45 shadow-lg'
            : 'shadow-xl'
        )}
        style={{ 
          backgroundColor: isOpen ? '#ffffff' : '#37352f',
        }}
      >
        {isOpen ? (
          <X 
            size={26} 
            strokeWidth={2}
            color="#37352f"
            className="flex-shrink-0"
          />
        ) : (
          <Plus 
            size={26} 
            strokeWidth={2}
            color="#ffffff"
            className="flex-shrink-0"
          />
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
