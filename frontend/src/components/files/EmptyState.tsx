import { Upload, FolderPlus, Download } from 'lucide-react';

interface EmptyStateProps {
  isRootFolder: boolean;
  onUpload: () => void;
  onNewFolder: () => void;
}

export function EmptyState({ isRootFolder, onUpload, onNewFolder }: EmptyStateProps) {
  // Simple empty state for subfolders
  if (!isRootFolder) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--text-tertiary)]">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
          <Upload size={24} strokeWidth={1.5} />
        </div>
        <p className="text-sm mb-1">This folder is empty</p>
        <p className="text-xs">Drop files here or use the + New button</p>
      </div>
    );
  }

  // Onboarding empty state for root folder (first-time users)
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium text-[var(--text-primary)] mb-2">
          Welcome to Telebox
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Your files are stored in your Telegram account. Unlimited storage, completely free.
        </p>
      </div>

      <div className="w-full space-y-3">
        <button
          onClick={onUpload}
          className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--accent-color)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
            <Upload size={20} strokeWidth={1.5} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Upload files</p>
            <p className="text-xs text-[var(--text-tertiary)]">Add photos, videos, documents, up to 2GB each</p>
          </div>
        </button>

        <button
          onClick={onNewFolder}
          className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
            <FolderPlus size={20} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Create a folder</p>
            <p className="text-xs text-[var(--text-tertiary)]">Organize your files into folders</p>
          </div>
        </button>

        <div className="w-full flex items-center gap-3 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] opacity-60 cursor-not-allowed text-left">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
            <Download size={20} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Import from Telegram</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--text-tertiary)] text-white">Coming Soon</span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)]">Bring in files already in your Saved Messages</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center">
        Tip: You can also drag and drop files anywhere on this page
      </p>
    </div>
  );
}
