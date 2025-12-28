import { useState } from 'react';
import { X, ArrowLeft, Search, Loader2, CheckCircle, XCircle } from 'lucide-react';
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

interface ImportProgress {
  current: number;
  total: number;
  currentFileName: string;
  completed: number[];
  failed: number[];
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export default function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [step, setStep] = useState<'dialogs' | 'files' | 'importing'>('dialogs');
  const [dialogs, setDialogs] = useState<Dialog[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedDialog, setSelectedDialog] = useState<Dialog | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);

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
      const response = await importApi.getDialogFiles(dialog.id, dialog.type);
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
    setStep('importing');
    
    const messageIds = Array.from(selectedFiles);
    const filesToImport = files.filter(f => selectedFiles.has(f.messageId));
    
    const progress: ImportProgress = {
      current: 0,
      total: messageIds.length,
      currentFileName: '',
      completed: [],
      failed: [],
    };
    setImportProgress(progress);

    for (let i = 0; i < messageIds.length; i++) {
      const messageId = messageIds[i];
      const fileInfo = filesToImport.find(f => f.messageId === messageId);
      
      progress.current = i + 1;
      progress.currentFileName = fileInfo?.name || `File ${i + 1}`;
      setImportProgress({ ...progress });

      try {
        await importApi.importSingleFile(
          selectedDialog.id,
          selectedDialog.name,
          selectedDialog.type,
          messageId
        );
        progress.completed.push(messageId);
      } catch (error) {
        console.error(`Failed to import file ${messageId}:`, error);
        progress.failed.push(messageId);
      }
      
      setImportProgress({ ...progress });
    }

    setImporting(false);
    
    const successCount = progress.completed.length;
    const failCount = progress.failed.length;
    
    if (successCount > 0) {
      onImportComplete();
    }
    
    if (failCount === 0) {
      alert(`Successfully imported ${successCount} files to folder "${selectedDialog.name}"`);
      handleClose();
    } else {
      alert(`Imported ${successCount} files. ${failCount} files failed.`);
    }
  };

  const handleClose = () => {
    if (importing) return; // Prevent closing during import
    setStep('dialogs');
    setDialogs([]);
    setFiles([]);
    setSelectedDialog(null);
    setSelectedFiles(new Set());
    setSearchQuery('');
    setImportProgress(null);
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
            {step === 'files' && !importing && (
              <button
                onClick={() => setStep('dialogs')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {step === 'dialogs' ? 'Import from Telegram' : 
               step === 'importing' ? 'Importing Files...' : selectedDialog?.name}
            </h2>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
            disabled={importing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'importing' && importProgress ? (
            <div className="py-4">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress: {importProgress.current} of {importProgress.total}</span>
                  <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500">Currently importing:</p>
                  <p className="font-medium truncate">{importProgress.currentFileName}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.filter(f => selectedFiles.has(f.messageId)).map((file) => {
                  const isCompleted = importProgress.completed.includes(file.messageId);
                  const isFailed = importProgress.failed.includes(file.messageId);
                  const isPending = !isCompleted && !isFailed && 
                    importProgress.currentFileName !== file.name;
                  
                  return (
                    <div
                      key={file.messageId}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCompleted ? 'bg-green-50' : 
                        isFailed ? 'bg-red-50' : 
                        'bg-gray-50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : isFailed ? (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      ) : isPending ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
                      )}
                      <span className={`truncate text-sm ${
                        isCompleted ? 'text-green-700' : 
                        isFailed ? 'text-red-700' : 
                        'text-gray-600'
                      }`}>
                        {file.name}
                      </span>
                    </div>
                  );
                })}
              </div>

              {importProgress.completed.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  ✓ {importProgress.completed.length} completed
                  {importProgress.failed.length > 0 && (
                    <span className="text-red-600 ml-3">
                      ✗ {importProgress.failed.length} failed
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : step === 'dialogs' ? (
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
