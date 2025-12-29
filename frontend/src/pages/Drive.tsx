import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { ContextMenu } from '@/components/files/ContextMenu';
import { UploadModal } from '@/components/modals/UploadModal';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { RenameModal } from '@/components/modals/RenameModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { FilePreviewModal } from '@/components/modals/FilePreviewModal';
import ImportModal from '@/components/modals/ImportModal';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { TrashView } from '@/components/files/TrashView';
import { MobileFAB } from '@/components/layout/MobileFAB';
import { useDriveStore, FolderItem, FileItem } from '@/stores/drive.store';
import { useFolders, useFiles, useFileSearch, useFavoriteFiles, useFavoriteFolders } from '@/lib/queries';
import { useDriveActions } from '@/hooks/useDriveActions';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';

export function DrivePage() {
  const { currentFolderId, viewMode, searchQuery, setSearchQuery, addToPath, currentView } = useDriveStore();
  const [showImport, setShowImport] = useState(false);
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{ x: number; y: number } | null>(null);
  const queryClient = useQueryClient();

  const {
    showUpload,
    showNewFolder,
    showRename,
    showPreview,
    showDeleteConfirm,
    previewFile,
    contextMenu,
    renameItem,
    deleteItem,
    setShowUpload,
    setShowNewFolder,
    setContextMenu,
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
    closeDeleteConfirm,
    closePreview,
    handleToggleFavorite,
  } = useDriveActions(currentFolderId);

  // Queries
  const { data: folders = [], isLoading: foldersLoading } = useFolders(currentFolderId);
  const { data: files = [], isLoading: filesLoading } = useFiles(currentFolderId);
  const { data: searchResults = [] } = useFileSearch(searchQuery);
  const { data: favoriteFiles = [], isLoading: favFilesLoading } = useFavoriteFiles();
  const { data: favoriteFolders = [], isLoading: favFoldersLoading } = useFavoriteFolders();

  const isLoading = currentView === 'favorites' 
    ? favFilesLoading || favFoldersLoading 
    : foldersLoading || filesLoading;
  
  const displayFiles = currentView === 'favorites' 
    ? favoriteFiles 
    : (searchQuery ? searchResults : files);
  const displayFolders = currentView === 'favorites' 
    ? favoriteFolders 
    : (searchQuery ? [] : folders);

  const handleFolderOpen = useCallback((folder: FolderItem) => {
    addToPath(folder);
  }, [addToPath]);

  // Debounce search to reduce API calls
  const debouncedSetSearchQuery = useDebouncedCallback(
    (query: string) => setSearchQuery(query),
    300
  );

  const handleSearch = useCallback((query: string) => {
    debouncedSetSearchQuery(query);
  }, [debouncedSetSearchQuery]);

  const handleImportComplete = () => {
    // Refresh folders and files after import
    queryClient.invalidateQueries({ queryKey: ['folders'] });
    queryClient.invalidateQueries({ queryKey: ['files'] });
    queryClient.invalidateQueries({ queryKey: ['folderTree'] });
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    // Only show context menu if clicking on the main content area (not on items)
    const target = e.target as HTMLElement;
    if (target.closest('[data-file-item]') || target.closest('[data-folder-item]')) {
      return;
    }
    e.preventDefault();
    setBackgroundContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="h-screen flex flex-col">
      <Header onSearch={handleSearch} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          onNewFolder={() => setShowNewFolder(true)}
          onUpload={() => setShowUpload(true)}
          onRenameFolder={(folder) => openRenameModalDirect(folder, 'folder')}
          onDeleteFolder={(folder) => openDeleteConfirmDirect(folder, 'folder')}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb />

          <div className="flex-1 overflow-auto" onContextMenu={handleBackgroundContextMenu}>
            {currentView === 'trash' ? (
              <TrashView />
            ) : viewMode === 'grid' ? (
              <FileGrid
                files={displayFiles}
                folders={displayFolders}
                isLoading={isLoading}
                currentFolderId={currentFolderId}
                onFolderOpen={handleFolderOpen}
                onFileOpen={handleFileOpen}
                onContextMenu={handleContextMenu}
                onUpload={() => setShowUpload(true)}
                onNewFolder={() => setShowNewFolder(true)}
              />
            ) : (
              <FileList
                files={displayFiles}
                folders={displayFolders}
                isLoading={isLoading}
                currentFolderId={currentFolderId}
                onFolderOpen={handleFolderOpen}
                onFileOpen={handleFileOpen}
                onContextMenu={handleContextMenu}
                onUpload={() => setShowUpload(true)}
                onNewFolder={() => setShowNewFolder(true)}
              />
            )}
          </div>
        </main>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          isFavorite={'isFavorite' in contextMenu.item ? contextMenu.item.isFavorite : false}
          onClose={() => setContextMenu(null)}
          onDownload={
            contextMenu.type === 'file'
              ? () => handleDownload(contextMenu.item as FileItem)
              : undefined
          }
          onRename={openRenameModal}
          onDelete={openDeleteConfirm}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {backgroundContextMenu && (
        <ContextMenu
          x={backgroundContextMenu.x}
          y={backgroundContextMenu.y}
          type="background"
          onClose={() => setBackgroundContextMenu(null)}
          onNewFolder={() => {
            setShowNewFolder(true);
            setBackgroundContextMenu(null);
          }}
          onUpload={() => {
            setShowUpload(true);
            setBackgroundContextMenu(null);
          }}
          onRename={() => {}}
          onDelete={() => {}}
        />
      )}

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        folderId={currentFolderId || undefined}
      />

      <NewFolderModal
        isOpen={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        onCreate={handleCreateFolder}
      />

      <RenameModal
        isOpen={showRename}
        currentName={renameItem?.name || ''}
        onClose={closeRenameModal}
        onRename={handleRename}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        itemName={deleteItem?.name || ''}
        itemType={deleteItem?.type || 'file'}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
      />

      {showPreview && previewFile && (
        <FilePreviewModal
          file={previewFile}
          allFiles={displayFiles}
          onClose={closePreview}
          onDownload={handleDownload}
        />
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImportComplete={handleImportComplete}
      />

      <MobileFAB
        onNewFolder={() => setShowNewFolder(true)}
        onUpload={() => setShowUpload(true)}
      />

      <UploadProgress />
    </div>
  );
}
