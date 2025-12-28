import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { FileGrid } from '@/components/files/FileGrid';
import { FileList } from '@/components/files/FileList';
import { ContextMenu } from '@/components/files/ContextMenu';
import { UploadModal } from '@/components/modals/UploadModal';
import { NewFolderModal } from '@/components/modals/NewFolderModal';
import { RenameModal } from '@/components/modals/RenameModal';
import { useDriveStore, FileItem, FolderItem } from '@/stores/drive.store';
import {
  useFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useFiles,
  useFileSearch,
  useUploadFile,
  useDownloadFile,
  useRenameFile,
  useDeleteFile,
} from '@/lib/queries';

interface ContextMenuState {
  x: number;
  y: number;
  item: FileItem | FolderItem;
  type: 'file' | 'folder';
}

export function DrivePage() {
  const { currentFolderId, viewMode, searchQuery, setSearchQuery, addToPath } = useDriveStore();

  const [showUpload, setShowUpload] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: 'file' | 'folder' } | null>(null);

  // Queries
  const { data: folders = [], isLoading: foldersLoading } = useFolders(currentFolderId);
  const { data: files = [], isLoading: filesLoading } = useFiles(currentFolderId);
  const { data: searchResults = [] } = useFileSearch(searchQuery);

  // Mutations
  const uploadFile = useUploadFile();
  const downloadFile = useDownloadFile();
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();

  const isLoading = foldersLoading || filesLoading;
  const displayFiles = searchQuery ? searchResults : files;
  const displayFolders = searchQuery ? [] : folders;

  const handleFolderOpen = (folder: FolderItem) => {
    addToPath(folder);
  };

  const handleFileOpen = (file: FileItem) => {
    downloadFile.mutate(file);
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    item: FileItem | FolderItem,
    type: 'file' | 'folder'
  ) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item, type });
  };

  const handleUpload = async (filesToUpload: File[]) => {
    for (const file of filesToUpload) {
      await uploadFile.mutateAsync({
        file,
        folderId: currentFolderId || undefined,
      });
    }
  };

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
          onRename={() => {
            setRenameItem({
              id: contextMenu.item.id,
              name: contextMenu.item.name,
              type: contextMenu.type,
            });
            setShowRename(true);
            setContextMenu(null);
          }}
          onMove={() => {
            // TODO: Implement move modal
          }}
          onDelete={handleDelete}
        />
      )}

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
      />

      <NewFolderModal
        isOpen={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        onCreate={handleCreateFolder}
      />

      <RenameModal
        isOpen={showRename}
        currentName={renameItem?.name || ''}
        onClose={() => {
          setShowRename(false);
          setRenameItem(null);
        }}
        onRename={handleRename}
      />
    </div>
  );
}
