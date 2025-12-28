import { useState, useEffect } from 'react';
import { FileItem, FolderItem } from '@/stores/drive.store';
import {
  useDownloadFile,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useRenameFile,
  useDeleteFile,
} from '@/lib/queries';

interface RenameItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

interface ContextMenuState {
  x: number;
  y: number;
  item: FileItem | FolderItem;
  type: 'file' | 'folder';
}

export function useDriveActions(currentFolderId: string | null) {
  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renameItem, setRenameItem] = useState<RenameItem | null>(null);

  const downloadFile = useDownloadFile();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();

  const handleCreateFolder = (name: string) => {
    createFolder.mutate({
      name,
      parentId: currentFolderId || undefined,
    });
  };

  const handleRename = (name: string) => {
    if (!renameItem) return;
    if (renameItem.type === 'folder') {
      updateFolder.mutate({ id: renameItem.id, name, parentId: currentFolderId });
    } else {
      renameFile.mutate({ id: renameItem.id, name, folderId: currentFolderId });
    }
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    if (contextMenu.type === 'folder') {
      deleteFolder.mutate({ id: contextMenu.item.id, parentId: currentFolderId });
    } else {
      deleteFile.mutate({ id: contextMenu.item.id, folderId: currentFolderId });
    }
    setContextMenu(null);
  };

  const handleFileOpen = (file: FileItem) => {
    // Check if file can be previewed
    const previewableMimes = [
      'image/', 'video/', 'audio/', 'application/pdf', 'text/', 'application/json'
    ];
    
    // Get effective MIME type - fallback to extension-based detection if generic
    const effectiveMimeType = file.mimeType === 'application/octet-stream' 
      ? getMimeTypeFromFilename(file.name) || file.mimeType
      : file.mimeType;
    
    const canPreview = previewableMimes.some(mime => 
      effectiveMimeType.toLowerCase().startsWith(mime.toLowerCase())
    );
    
    if (canPreview) {
      // Pass the effective MIME type to the preview
      setPreviewFile({ ...file, mimeType: effectiveMimeType });
      setShowPreview(true);
    } else {
      downloadFile.mutate(file);
    }
  };

// Helper function to detect MIME type from filename
function getMimeTypeFromFilename(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;

  const mimeTypes: Record<string, string> = {
    // Images
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    // Videos
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'mkv': 'video/x-matroska',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'm4a': 'audio/mp4',
    // Documents
    'pdf': 'application/pdf',
    // Text
    'txt': 'text/plain',
    'json': 'application/json',
    'xml': 'text/xml',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'md': 'text/markdown',
  };

  return mimeTypes[ext] || null;
}

  const handleDownload = (file: FileItem) => {
    downloadFile.mutate(file);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  // Listen for preview navigation events
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<FileItem>;
      setPreviewFile(customEvent.detail);
    };

    window.addEventListener('preview-navigate', handleNavigate);
    return () => window.removeEventListener('preview-navigate', handleNavigate);
  }, []);

  const handleContextMenu = (
    e: React.MouseEvent,
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  const openRenameModal = () => {
    if (!contextMenu) return;
    setRenameItem({
      id: contextMenu.item.id,
      name: contextMenu.item.name,
      type: contextMenu.type,
    });
    setShowRename(true);
    setContextMenu(null);
  };

  const closeRenameModal = () => {
    setShowRename(false);
    setRenameItem(null);
  };

  return {
    // State
    showUpload,
    showNewFolder,
    showRename,
    showPreview,
    previewFile,
    contextMenu,
    renameItem,
    // Setters
    setShowUpload,
    setShowNewFolder,
    setContextMenu,
    // Handlers
    handleCreateFolder,
    handleRename,
    handleDelete,
    handleFileOpen,
    handleDownload,
    handleContextMenu,
    openRenameModal,
    closeRenameModal,
    closePreview,
  };
}
