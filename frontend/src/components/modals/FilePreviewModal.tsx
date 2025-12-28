import { useEffect, useState } from 'react';
import { X, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { FileItem } from '@/stores/drive.store';
import { filesApi } from '@/lib/api';
import { cn, formatFileSize } from '@/lib/utils';

interface FilePreviewModalProps {
  file: FileItem;
  allFiles: FileItem[];
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

type PreviewType = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported';

function getPreviewType(mimeType: string): PreviewType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'text';
  return 'unsupported';
}

export function FilePreviewModal({ file, allFiles, onClose, onDownload }: FilePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const previewType = getPreviewType(file.mimeType);
  const currentIndex = allFiles.findIndex((f) => f.id === file.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allFiles.length - 1;

  useEffect(() => {
    const loadPreview = async () => {
      setLoading(true);
      setError(null);
      setPreviewUrl(null);
      setTextContent(null);

      try {
        const response = await filesApi.download(file.id);
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);

        if (previewType === 'text') {
          const text = await blob.text();
          setTextContent(text);
        } else {
          setPreviewUrl(url);
        }
      } catch (err) {
        setError('Failed to load preview');
        console.error('Preview error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file.id, previewType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) navigatePrev();
      if (e.key === 'ArrowRight' && hasNext) navigateNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasPrev, hasNext, currentIndex]);

  const navigatePrev = () => {
    if (hasPrev) {
      const prevFile = allFiles[currentIndex - 1];
      window.dispatchEvent(new CustomEvent('preview-navigate', { detail: prevFile }));
    }
  };

  const navigateNext = () => {
    if (hasNext) {
      const nextFile = allFiles[currentIndex + 1];
      window.dispatchEvent(new CustomEvent('preview-navigate', { detail: nextFile }));
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-[var(--text-secondary)]" size={32} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-[var(--text-secondary)]">{error}</p>
          <button
            onClick={() => onDownload(file)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            Download File
          </button>
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={previewUrl!}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        );

      case 'pdf':
        return (
          <iframe
            src={previewUrl!}
            className="w-full h-full"
            title={file.name}
          />
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <video
              src={previewUrl!}
              controls
              className="max-w-full max-h-full"
            >
              Your browser does not support video playback.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center h-full p-8">
            <audio src={previewUrl!} controls className="w-full max-w-md">
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case 'text':
        return (
          <div className="h-full overflow-auto p-6">
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {textContent}
            </pre>
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <p className="text-[var(--text-secondary)]">
              Preview not available for this file type
            </p>
            <button
              onClick={() => onDownload(file)}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
            >
              Download File
            </button>
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[90vh] m-4 bg-white rounded-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{file.name}</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {formatFileSize(file.size)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-lg"
              title="Download"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--hover-bg)] rounded-lg"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden">
          {renderPreview()}
        </div>

        {/* Navigation */}
        {allFiles.length > 1 && (
          <>
            <button
              onClick={navigatePrev}
              disabled={!hasPrev}
              className={cn(
                'absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg',
                'hover:bg-gray-50 transition-all',
                !hasPrev && 'opacity-50 cursor-not-allowed'
              )}
              title="Previous (←)"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={navigateNext}
              disabled={!hasNext}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-lg',
                'hover:bg-gray-50 transition-all',
                !hasNext && 'opacity-50 cursor-not-allowed'
              )}
              title="Next (→)"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
