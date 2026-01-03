import { useState, useEffect } from 'react';
import { FileItem, FolderItem } from '@/stores/drive.store';
import {
  useDownloadFile,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useBatchDeleteFolders,
  useRenameFile,
  useDeleteFile,
  useBatchDeleteFiles,
  useToggleFileFavorite,
  useToggleFolderFavorite,
  useMoveFile,
  useBatchMoveFiles,
  useMoveFolder,
  useBatchMoveFolders,
} from '@/lib/queries';

interface RenameItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
}

interface MoveItem {
  id: string;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveTo, setShowMoveTo] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renameItem, setRenameItem] = useState<RenameItem | null>(null);
  const [moveItems, setMoveItems] = useState<MoveItem[] | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);
  const [deleteItems, setDeleteItems] = useState<{ 
    ids: string[]; 
    count: number; 
    type: 'mixed' | 'file' | 'folder';
    fileIds?: string[];
    folderIds?: string[];
  } | null>(null);

  const downloadFile = useDownloadFile();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const batchDeleteFolders = useBatchDeleteFolders();
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const batchDeleteFiles = useBatchDeleteFiles();
  const toggleFileFavorite = useToggleFileFavorite();
  const toggleFolderFavorite = useToggleFolderFavorite();
  const moveFile = useMoveFile();
  const batchMoveFiles = useBatchMoveFiles();
  const moveFolder = useMoveFolder();
  const batchMoveFolders = useBatchMoveFolders();

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

  const openDeleteConfirm = () => {
    if (!contextMenu) return;
    setDeleteItem({
      id: contextMenu.item.id,
      name: contextMenu.item.name,
      type: contextMenu.type,
    });
    setShowDeleteConfirm(true);
    setContextMenu(null);
  };

  // Direct delete - doesn't depend on contextMenu state
  const openDeleteConfirmDirect = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setDeleteItem({
      id: item.id,
      name: item.name,
      type,
    });
    setShowDeleteConfirm(true);
  };

  const handleDelete = () => {
    if (deleteItem) {
      // Single item delete
      if (deleteItem.type === 'folder') {
        deleteFolder.mutate({ id: deleteItem.id, parentId: currentFolderId });
      } else {
        deleteFile.mutate({ id: deleteItem.id, folderId: currentFolderId });
      }
      setDeleteItem(null);
    } else if (deleteItems) {
      // Bulk delete
      if (deleteItems.type === 'folder' && deleteItems.folderIds) {
        batchDeleteFolders.mutate({ folderIds: deleteItems.folderIds, parentId: currentFolderId });
      } else if (deleteItems.type === 'file' && deleteItems.fileIds) {
        batchDeleteFiles.mutate({ fileIds: deleteItems.fileIds, folderId: currentFolderId });
      } else if (deleteItems.type === 'mixed') {
        // Mixed - delete both files and folders
        if (deleteItems.fileIds && deleteItems.fileIds.length > 0) {
          batchDeleteFiles.mutate({ fileIds: deleteItems.fileIds, folderId: currentFolderId });
        }
        if (deleteItems.folderIds && deleteItems.folderIds.length > 0) {
          batchDeleteFolders.mutate({ folderIds: deleteItems.folderIds, parentId: currentFolderId });
        }
      }
      setDeleteItems(null);
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeleteItem(null);
    setDeleteItems(null);
  };

  // Bulk delete for selected items
  const openBulkDeleteConfirm = (items: Array<FileItem | FolderItem>, types: Array<'file' | 'folder'>) => {
    const fileIds: string[] = [];
    const folderIds: string[] = [];
    
    items.forEach((item, index) => {
      if (types[index] === 'file') {
        fileIds.push(item.id);
      } else {
        folderIds.push(item.id);
      }
    });
    
    const fileCount = fileIds.length;
    const folderCount = folderIds.length;
    
    let type: 'mixed' | 'file' | 'folder' = 'mixed';
    if (fileCount > 0 && folderCount === 0) type = 'file';
    else if (folderCount > 0 && fileCount === 0) type = 'folder';
    
    // Store both file and folder IDs together, we'll separate them in handleDelete
    const allIds = [...fileIds, ...folderIds];
    setDeleteItems({ ids: allIds, count: allIds.length, type, fileIds, folderIds });
    setShowDeleteConfirm(true);
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

  // Direct rename - doesn't depend on contextMenu state
  const openRenameModalDirect = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setRenameItem({
      id: item.id,
      name: item.name,
      type,
    });
    setShowRename(true);
  };

  const closeRenameModal = () => {
    setShowRename(false);
    setRenameItem(null);
  };

  const handleToggleFavorite = () => {
    if (!contextMenu) return;
    if (contextMenu.type === 'folder') {
      toggleFolderFavorite.mutate({ id: contextMenu.item.id, parentId: currentFolderId });
    } else {
      toggleFileFavorite.mutate({ id: contextMenu.item.id, folderId: currentFolderId });
    }
    setContextMenu(null);
  };

  // Move to handlers
  const openMoveToModal = () => {
    if (!contextMenu) return;
    setMoveItems([{ id: contextMenu.item.id, type: contextMenu.type }]);
    setShowMoveTo(true);
    setContextMenu(null);
  };

  const openMoveToModalDirect = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    setMoveItems([{ id: item.id, type }]);
    setShowMoveTo(true);
  };

  const openBulkMoveToModal = (items: Array<FileItem | FolderItem>, types: Array<'file' | 'folder'>) => {
    const moveItemsList = items.map((item, index) => ({
      id: item.id,
      type: types[index],
    }));
    setMoveItems(moveItemsList);
    setShowMoveTo(true);
  };

  const handleMove = (targetFolderId: string | null) => {
    if (!moveItems || moveItems.length === 0) return;

    const fileIds = moveItems.filter(item => item.type === 'file').map(item => item.id);
    const folderIds = moveItems.filter(item => item.type === 'folder').map(item => item.id);

    // Move files
    if (fileIds.length === 1) {
      moveFile.mutate({ 
        id: fileIds[0], 
        folderId: targetFolderId, 
        sourceFolderId: currentFolderId 
      });
    } else if (fileIds.length > 1) {
      batchMoveFiles.mutate({ 
        fileIds, 
        folderId: targetFolderId, 
        sourceFolderId: currentFolderId 
      });
    }

    // Move folders
    if (folderIds.length === 1) {
      moveFolder.mutate({ 
        id: folderIds[0], 
        parentId: targetFolderId, 
        sourceParentId: currentFolderId 
      });
    } else if (folderIds.length > 1) {
      batchMoveFolders.mutate({ 
        folderIds, 
        parentId: targetFolderId, 
        sourceParentId: currentFolderId 
      });
    }

    closeMoveToModal();
  };

  const closeMoveToModal = () => {
    setShowMoveTo(false);
    setMoveItems(null);
  };

  // Get move item type for modal display
  const getMoveItemType = (): 'file' | 'folder' | 'mixed' => {
    if (!moveItems || moveItems.length === 0) return 'file';
    const hasFiles = moveItems.some(item => item.type === 'file');
    const hasFolders = moveItems.some(item => item.type === 'folder');
    if (hasFiles && hasFolders) return 'mixed';
    return hasFiles ? 'file' : 'folder';
  };

  // Get folder IDs to exclude from move target (can't move folder into itself)
  const getExcludeFolderIds = (): string[] => {
    if (!moveItems) return [];
    return moveItems.filter(item => item.type === 'folder').map(item => item.id);
  };

  return {
    // State
    showUpload,
    showNewFolder,
    showRename,
    showPreview,
    showDeleteConfirm,
    showMoveTo,
    previewFile,
    contextMenu,
    renameItem,
    moveItems,
    deleteItem,
    deleteItems,
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
    openRenameModalDirect,
    closeRenameModal,
    openDeleteConfirm,
    openDeleteConfirmDirect,
    openBulkDeleteConfirm,
    closeDeleteConfirm,
    closePreview,
    handleToggleFavorite,
    // Move handlers
    openMoveToModal,
    openMoveToModalDirect,
    openBulkMoveToModal,
    handleMove,
    closeMoveToModal,
    getMoveItemType,
    getExcludeFolderIds,
    isMoveLoading: moveFile.isPending || batchMoveFiles.isPending || moveFolder.isPending || batchMoveFolders.isPending,
  };
}
