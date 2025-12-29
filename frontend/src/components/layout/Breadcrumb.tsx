import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useDriveStore } from '@/stores/drive.store';

export function Breadcrumb() {
  const { folderPath, navigateToPathIndex } = useDriveStore();
  const [showDropdown, setShowDropdown] = useState(false);

  // On mobile, show collapsed breadcrumb if path is long
  const maxVisibleItems = 2;
  const shouldCollapse = folderPath.length > maxVisibleItems;
  const collapsedItems = shouldCollapse ? folderPath.slice(0, -maxVisibleItems) : [];
  const visibleItems = shouldCollapse ? folderPath.slice(-maxVisibleItems) : folderPath;

  return (
    <div className="flex items-center gap-1 px-2 sm:px-4 py-2 text-sm border-b border-[var(--border-color)] bg-white overflow-x-auto">
      <button
        onClick={() => navigateToPathIndex(-1)}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--bg-hover)] flex-shrink-0"
      >
        <Home size={14} />
        <span className="hidden sm:inline">My Drive</span>
      </button>

      {/* Collapsed items dropdown (mobile) */}
      {shouldCollapse && (
        <>
          <ChevronRight size={14} className="text-[var(--text-secondary)] flex-shrink-0" />
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-2 py-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
            >
              <MoreHorizontal size={14} />
            </button>
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="absolute left-0 top-full mt-1 bg-white rounded-lg py-1 z-50 min-w-[150px] shadow-[0_0_0_1px_rgba(15,15,15,0.05),0_3px_6px_rgba(15,15,15,0.1),0_9px_24px_rgba(15,15,15,0.2)]">
                  {collapsedItems.map((folder, index) => (
                    <button
                      key={folder.id}
                      onClick={() => {
                        navigateToPathIndex(index);
                        setShowDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] truncate"
                    >
                      {folder.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {visibleItems.map((folder, index) => {
        const actualIndex = shouldCollapse ? collapsedItems.length + index : index;
        return (
          <div key={folder.id} className="flex items-center flex-shrink-0">
            <ChevronRight size={14} className="text-[var(--text-secondary)]" />
            <button
              onClick={() => navigateToPathIndex(actualIndex)}
              className={cn(
                'px-2 py-1 rounded hover:bg-[var(--bg-hover)] truncate max-w-[120px] sm:max-w-[200px]',
                actualIndex === folderPath.length - 1 && 'font-medium'
              )}
            >
              {folder.name}
            </button>
          </div>
        );
      })}
    </div>
  );
}
