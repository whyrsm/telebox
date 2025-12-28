import { useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Check, Loader2 } from 'lucide-react';
import { useUploadStore, UploadItem } from '@/stores/upload.store';
import { useUploadProcessor } from '@/hooks/useUploadProcessor';
import { cn, formatFileSize } from '@/lib/utils';

function UploadItemRow({ item }: { item: UploadItem }) {
  const { removeUpload } = useUploadStore();

  return (
    <div className="flex items-center gap-3 py-2 px-3 border-b border-[var(--border-color)] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm truncate">{item.file.name}</span>
          <span className="text-xs text-[var(--text-secondary)] shrink-0">
            {formatFileSize(item.file.size)}
          </span>
        </div>
        {item.status === 'uploading' && (
          <div className="mt-1 h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        )}
        {item.status === 'error' && (
          <p className="text-xs text-red-500 mt-0.5 truncate">{item.error || 'Upload failed'}</p>
        )}
      </div>

      <div className="shrink-0">
        {item.status === 'pending' && (
          <span className="text-xs text-[var(--text-secondary)]">Waiting...</span>
        )}
        {item.status === 'uploading' && (
          <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
        )}
        {item.status === 'success' && <Check size={16} className="text-green-500" />}
        {item.status === 'error' && (
          <button
            onClick={() => removeUpload(item.id)}
            className="p-1 hover:bg-[var(--hover-bg)] rounded"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export function UploadProgress() {
  const { uploads, isMinimized, setMinimized, clearCompleted } = useUploadStore();

  // Process upload queue
  useUploadProcessor();

  // Auto-clear completed uploads after delay
  useEffect(() => {
    const completed = uploads.filter((u) => u.status === 'success');
    if (completed.length > 0) {
      const timer = setTimeout(() => clearCompleted(), 3000);
      return () => clearTimeout(timer);
    }
  }, [uploads, clearCompleted]);

  if (uploads.length === 0) return null;

  const activeCount = uploads.filter((u) => u.status === 'uploading' || u.status === 'pending').length;
  const completedCount = uploads.filter((u) => u.status === 'success').length;
  const errorCount = uploads.filter((u) => u.status === 'error').length;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border border-[var(--border-color)]',
        'w-80 max-h-96 flex flex-col'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] cursor-pointer"
        onClick={() => setMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          {activeCount > 0 && <Loader2 size={14} className="animate-spin text-[var(--accent)]" />}
          <span className="text-sm font-medium">
            {activeCount > 0
              ? `Uploading ${activeCount} file${activeCount > 1 ? 's' : ''}`
              : completedCount > 0
                ? `${completedCount} uploaded`
                : `${errorCount} failed`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* File list */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto">
          {uploads.map((item) => (
            <UploadItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Footer with clear action */}
      {!isMinimized && (completedCount > 0 || errorCount > 0) && (
        <div className="px-3 py-2 border-t border-[var(--border-color)]">
          <button
            onClick={clearCompleted}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            Clear completed
          </button>
        </div>
      )}
    </div>
  );
}
