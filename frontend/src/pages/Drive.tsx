import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { ContextMenu } from '@/components/files/ContextMenu';
import { UploadModal } from '@/components/modals/UploadModal';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { RenameModal } from '@/components/modals/RenameModal';
import { FilePreviewModal } from '@/components/modals/FilePreviewModal';
import ImportModal from '@/components/modals/ImportModal';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { useDriveStore, FolderItem, FileItem } from '@/stores/drive.store';
import { useFolders, useFiles, useFileSearch } from '@/lib/queries';
import { useDriveActions } from '@/hooks/useDriveActions';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function DrivePage() {
  const { currentFolderId, viewMode, searchQuery, setSearchQuery, addToPath } = useDriveStore();
  const [showImport, setShowImport] = useState(false);
  const [backgroundContextMenu, setBackgroundContextMenu] = useState<{ x: number; y: number } | null>(null);
  const queryClient = useQueryClient();

  const {
    showUpload,
    showNewFolder,
    showRename,
    showPreview,
    previewFile,
    contextMenu,
    renameItem,
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
    closeRenameModal,
    closePreview,
  } = useDriveActions(currentFolderId);

  // Queries
  const { data: folders = [], isLoading: foldersLoading } = useFolders(currentFolderId);
  const { data: files = [], isLoading: filesLoading } = useFiles(currentFolderId);
  const { data: searchResults = [] } = useFileSearch(searchQuery);

  const isLoading = foldersLoading || filesLoading;
  const displayFiles = searchQuery ? searchResults : files;
  const displayFolders = searchQuery ? [] : folders;

  const handleFolderOpen = (folder: FolderItem) => {
    addToPath(folder);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
      <Header onUpload={() => setShowUpload(true)} onSearch={handleSearch} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          onNewFolder={() => setShowNewFolder(true)} 
          onImport={() => setShowImport(true)}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb />

          <div className="flex-1 overflow-auto" onContextMenu={handleBackgroundContextMenu}>
            {viewMode === 'grid' ? (
              <FileGrid
                files={displayFiles}
                folders={displayFolders}
                isLoading={isLoading}
                onFolderOpen={handleFolderOpen}
                onFileOpen={handleFileOpen}
                onContextMenu={handleContextMenu}
              />
            ) : (
              <FileList
                files={displayFiles}
                folders={displayFolders}
                isLoading={isLoading}
                onFolderOpen={handleFolderOpen}
                onFileOpen={handleFileOpen}
                onContextMenu={handleContextMenu}
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
          onClose={() => setContextMenu(null)}
          onDownload={
            contextMenu.type === 'file'
              ? () => handleDownload(contextMenu.item as FileItem)
              : undefined
          }
          onRename={openRenameModal}
          onMove={() => {
            // TODO: Implement move modal
          }}
          onDelete={handleDelete}
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
          onMove={() => {}}
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

      <UploadProgress />
    </div>
  );
}
