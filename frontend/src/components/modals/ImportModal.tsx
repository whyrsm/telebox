import { useState } from 'react';
import { X, ArrowLeft, Search, Loader2 } from 'lucide-react';
import { importApi } from '../../lib/api';
import { formatFileSize } from '../../lib/utils';

interface Dialog {
  id: string;
  name: string;
  type: 'user' | 'group' | 'channel' | 'saved';
}

interface FileInfo {
  messageId: number;
  name: string;
  size: number;
  mimeType: string;
  date: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<'dialogs' | 'files'>('dialogs');
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadDialogs = async () => {
    setLoading(true);
    try {
      const response = await importApi.getDialogs();
      setDialogs(response.data);
    } catch (error) {
      console.error('Failed to load dialogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (dialog: Dialog) => {
    setLoading(true);
    try {
      const response = await importApi.getDialogFiles(dialog.id);
      setFiles(response.data);
      setSelectedDialog(dialog);
      setStep('files');
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedDialog || selectedFiles.size === 0) return;

    setImporting(true);
    try {
      console.log('Starting import:', {
        chatId: selectedDialog.id,
        chatName: selectedDialog.name,
        messageIds: Array.from(selectedFiles),
      });
      
      const result = await importApi.importFiles(
        selectedDialog.id,
        selectedDialog.name,
        Array.from(selectedFiles)
      );
      
      console.log('Import result:', result.data);
      alert(`Successfully imported ${result.data.count} files to folder "${result.data.folder.name}"`);
      
      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Failed to import files:', error);
      alert('Failed to import files. Check console for details.');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep('dialogs');
    setDialogs([]);
    setFiles([]);
    setSelectedDialog(null);
    setSelectedFiles(new Set());
    setSearchQuery('');
    onClose();
  };

  const toggleFile = (messageId: number) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.messageId)));
    }
  };

  const filteredDialogs = dialogs.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDialogIcon = (type: string) => {
    switch (type) {
      case 'saved': return '💾';
      case 'user': return '👤';
      case 'group': return '👥';
      case 'channel': return '📢';
      default: return '💬';
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
    return '📄';
  };

  const selectedSize = files
    .filter(f => selectedFiles.has(f.messageId))
    .reduce((sum, f) => sum + f.size, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {step === 'files' && (
              <button
                onClick={() => setStep('dialogs')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {step === 'dialogs' ? 'Import from Telegram' : selectedDialog?.name}
            </h2>
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'dialogs' ? (
            <>
              <p className="text-gray-600 mb-4">Select a chat to import files from:</p>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => !dialogs.length && loadDialogs()}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDialogs.map((dialog) => (
                    <button
                      key={dialog.id}
                      onClick={() => loadFiles(dialog)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-left transition-colors"
                    >
                      <span className="text-2xl">{getDialogIcon(dialog.type)}</span>
                      <span className="flex-1 font-medium">{dialog.name}</span>
                      <span className="text-gray-400">→</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">Select files to import:</p>
              <p className="text-sm text-gray-500 mb-4">
                Will be saved to folder: <span className="font-medium">"{selectedDialog?.name}"</span>
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No files found in this chat</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFiles.size === files.length}
                        onChange={toggleAll}
                        className="w-4 h-4"
                      />
                      <span className="font-medium">
                        Select All ({files.length} files)
                      </span>
                    </label>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {files.map((file) => (
                      <label
                        key={file.messageId}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.messageId)}
                          onChange={() => toggleFile(file.messageId)}
                          className="w-4 h-4"
                        />
                        <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {step === 'files' && files.length > 0 && (
          <div className="border-t p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">
                Selected: {selectedFiles.size} files ({formatFileSize(selectedSize)})
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={selectedFiles.size === 0 || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                Import Selected
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
