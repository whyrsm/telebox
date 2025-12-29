import { HardDrive } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function StorageIndicator() {
  const user = useAuthStore((s) => s.user);

  if (!user?.storage) return null;

  const totalSize = Number(user.storage.totalSize);
  const fileCount = user.storage.fileCount;

  return (
    <div className="px-4 py-3 border-t border-[var(--border-color)]">
      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
        <HardDrive size={14} strokeWidth={2} />
        <div className="flex-1 text-xs">
          <div className="font-medium text-[var(--text-primary)]">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </div>
          <div className="text-[var(--text-tertiary)]">
            {formatBytes(totalSize)}
          </div>
        </div>
      </div>
    </div>
  );
}
