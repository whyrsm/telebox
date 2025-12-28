import { useState, useRef } from 'react';
import { X, Upload, File } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[]) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles);
      setSelectedFiles([]);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
          <h2 className="font-medium">Upload Files</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--hover-bg)] rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer',
              'transition-colors',
              isDragging
                ? 'border-[var(--accent)] bg-[var(--selected-bg)]'
                : 'border-[var(--border-color)] hover:border-[var(--accent)]'
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <Upload size={32} className="mx-auto mb-2 text-[var(--text-secondary)]" />
            <p className="text-sm">Drag and drop files here</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">or click to browse</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4 max-h-48 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 py-2 border-b border-[var(--border-color)] last:border-0"
                >
                  <File size={16} className="text-[var(--text-secondary)]" />
                  <span className="flex-1 text-sm truncate">{file.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-[var(--hover-bg)] rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-md hover:bg-[var(--hover-bg)]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0}
            className={cn(
              'px-4 py-1.5 text-sm rounded-md',
              'bg-[var(--accent)] text-white',
              'hover:opacity-90 disabled:opacity-50'
            )}
          >
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
