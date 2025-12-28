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
      updateFolder.mutate({ id: renameItem.id, name });
    } else {
      renameFile.mutate({ id: renameItem.id, name });
    }
  };

  const handleDelete = () => {
    if (!contextMenu) return;
    if (contextMenu.type === 'folder') {
      deleteFolder.mutate(contextMenu.item.id);
    } else {
      deleteFile.mutate(contextMenu.item.id);
    }
    setContextMenu(null);
  };

  const handleFileOpen = (file: FileItem) => {
    // Check if file can be previewed
    const previewableMimes = [
      'image/', 'video/', 'audio/', 'application/pdf', 'text/', 'application/json'
    ];
    const canPreview = previewableMimes.some(mime => file.mimeType.startsWith(mime));
    
    if (canPreview) {
      setPreviewFile(file);
      setShowPreview(true);
    } else {
      downloadFile.mutate(file);
    }
  };

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
