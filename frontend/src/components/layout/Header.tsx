import { useState } from 'react';
import { Search, Grid, List, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDriveStore } from '@/stores/drive.store';
import { useAuthStore } from '@/stores/auth.store';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { viewMode, setViewMode, searchQuery, setSearchQuery } = useDriveStore();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="h-14 border-b border-[var(--border-color)] flex items-center px-4 gap-4 bg-white">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[var(--accent)] rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="font-semibold text-lg">TDrive</span>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
          />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-md',
              'bg-[var(--bg-secondary)] border border-transparent',
              'focus:border-[var(--accent)] focus:outline-none',
              'text-sm'
            )}
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <div className="flex border border-[var(--border-color)] rounded-md overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5',
              viewMode === 'grid' ? 'bg-[var(--selected-bg)]' : 'hover:bg-[var(--hover-bg)]'
            )}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5',
              viewMode === 'list' ? 'bg-[var(--selected-bg)]' : 'hover:bg-[var(--hover-bg)]'
            )}
          >
            <List size={18} />
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center hover:bg-[var(--hover-bg)]"
          >
            <User size={18} />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[var(--border-color)] rounded-md shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-[var(--border-color)]">
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">{user?.phone}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--hover-bg)] text-left"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
