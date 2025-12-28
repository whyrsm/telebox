import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { ContextMenu } from '@/components/files/ContextMenu';
import { UploadModal } from '@/components/modals/UploadModal';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { RenameModal } from '@/components/modals/RenameModal';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { useDriveStore, FolderItem, FileItem } from '@/stores/drive.store';
import { useFolders, useFiles, useFileSearch } from '@/lib/queries';
import { useDriveActions } from '@/hooks/useDriveActions';

export function DrivePage() {
  const { currentFolderId, viewMode, searchQuery, setSearchQuery, addToPath } = useDriveStore();

  const {
    showUpload,
    showNewFolder,
    showRename,
    contextMenu,
    renameItem,
    setShowUpload,
    setShowNewFolder,
    setContextMenu,
    handleCreateFolder,
    handleRename,
    handleDelete,
    handleFileOpen,
    handleContextMenu,
    openRenameModal,
    closeRenameModal,
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

  return (
    <div className="h-screen flex flex-col">
      <Header onUpload={() => setShowUpload(true)} onSearch={handleSearch} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onNewFolder={() => setShowNewFolder(true)} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb />

          <div className="flex-1 overflow-auto">
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
              ? () => handleFileOpen(contextMenu.item as FileItem)
              : undefined
          }
          onRename={openRenameModal}
          onMove={() => {
            // TODO: Implement move modal
          }}
          onDelete={handleDelete}
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

      <UploadProgress />
    </div>
  );
}
