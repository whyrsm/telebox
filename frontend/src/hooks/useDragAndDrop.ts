import { useState, useCallback, DragEvent } from 'react';
import { useMoveFile, useMoveFolder, useBatchMoveFiles, useBatchMoveFolders } from '@/lib/queries';
import { FileItem, FolderItem, useDriveStore } from '@/stores/drive.store';

export type DragItemType = 'file' | 'folder';

export interface DragItem {
  id: string;
  type: DragItemType;
  name: string;
  sourceFolderId: string | null;
}

export interface MultiDragData {
  items: DragItem[];
  fileIds: string[];
  folderIds: string[];
  sourceFolderId: string | null;
}

export interface MoveResult {
  itemName: string;
  targetName: string;
}

export function useDragAndDrop(currentFolderId: string | null) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragCount, setDragCount] = useState(1);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [lastMoveResult, setLastMoveResult] = useState<MoveResult | null>(null);
  const [successFlashId, setSuccessFlashId] = useState<string | null>(null);

  const { selectedItems } = useDriveStore();

  const moveFile = useMoveFile();
  const moveFolder = useMoveFolder();
  const batchMoveFiles = useBatchMoveFiles();
  const batchMoveFolders = useBatchMoveFolders();

  const triggerSuccessFlash = useCallback((targetId: string) => {
    setSuccessFlashId(targetId);
    setTimeout(() => setSuccessFlashId(null), 600);
  }, []);

  const clearMoveResult = useCallback(() => {
    setLastMoveResult(null);
  }, []);

  const handleDragStart = useCallback(
    (e: DragEvent, item: FileItem | FolderItem, type: DragItemType, allFiles: FileItem[] = [], allFolders: FolderItem[] = []) => {
      const itemId = item.id;
      const isSelected = selectedItems.has(itemId);
      
      // If dragging a selected item, include all selected items
      // If dragging an unselected item, only drag that item
      const itemsToMove = isSelected && selectedItems.size > 1
        ? Array.from(selectedItems)
        : [itemId];

      // Separate files and folders from selection
      const fileIds: string[] = [];
      const folderIds: string[] = [];
      const items: DragItem[] = [];

      itemsToMove.forEach(id => {
        const file = allFiles.find(f => f.id === id);
        const folder = allFolders.find(f => f.id === id);
        
        if (file) {
          fileIds.push(id);
          items.push({
            id,
            type: 'file',
            name: file.name,
            sourceFolderId: file.folderId,
          });
        } else if (folder) {
          folderIds.push(id);
          items.push({
            id,
            type: 'folder',
            name: folder.name,
            sourceFolderId: folder.parentId,
          });
        }
      });

      // If the dragged item wasn't in selection, add it
      if (!isSelected || selectedItems.size <= 1) {
        const dragItem: DragItem = {
          id: item.id,
          type,
          name: item.name,
          sourceFolderId: type === 'file' ? (item as FileItem).folderId : (item as FolderItem).parentId,
        };
        
        if (type === 'file') {
          fileIds.length = 0;
          fileIds.push(item.id);
          folderIds.length = 0;
        } else {
          folderIds.length = 0;
          folderIds.push(item.id);
          fileIds.length = 0;
        }
        
        items.length = 0;
        items.push(dragItem);
      }

      const multiDragData: MultiDragData = {
        items,
        fileIds,
        folderIds,
        sourceFolderId: currentFolderId,
      };
      
      setDraggedItem(items[0]);
      setDragCount(items.length);
      e.dataTransfer.setData('application/json', JSON.stringify(multiDragData));
      e.dataTransfer.effectAllowed = 'move';
      
      // Visual feedback
      const dragEl = e.currentTarget as HTMLElement;
      dragEl.style.opacity = '0.5';
    },
    [selectedItems, currentFolderId]
  );

  const handleDragEnd = useCallback((e: DragEvent) => {
    const dragEl = e.currentTarget as HTMLElement;
    dragEl.style.opacity = '1';
    setDraggedItem(null);
    setDragCount(1);
    setDropTargetId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent, targetFolder: FolderItem) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Don't allow dropping on itself
      if (draggedItem?.id === targetFolder.id) {
        e.dataTransfer.dropEffect = 'none';
        return;
      }
      
      // Don't allow dropping a folder into its own child
      if (draggedItem?.type === 'folder' && draggedItem.id === targetFolder.parentId) {
        e.dataTransfer.dropEffect = 'none';
        return;
      }
      
      e.dataTransfer.dropEffect = 'move';
      setDropTargetId(targetFolder.id);
    },
    [draggedItem]
  );

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDropTargetId(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, targetFolder: FolderItem) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetId(null);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const dragData: MultiDragData = JSON.parse(data);
        const { items, fileIds, folderIds, sourceFolderId } = dragData;
        
        // Don't drop folder on itself
        if (folderIds.includes(targetFolder.id)) return;
        
        // Don't move to same location (for single items)
        if (items.length === 1) {
          const item = items[0];
          if (item.type === 'file' && item.sourceFolderId === targetFolder.id) return;
          if (item.type === 'folder' && item.sourceFolderId === targetFolder.id) return;
        }

        const totalCount = fileIds.length + folderIds.length;
        const itemName = totalCount === 1 ? items[0].name : `${totalCount} items`;

        const onAllSuccess = () => {
          setLastMoveResult({ itemName, targetName: targetFolder.name });
          triggerSuccessFlash(targetFolder.id);
        };

        let pendingOps = 0;
        let completedOps = 0;

        const checkComplete = () => {
          completedOps++;
          if (completedOps === pendingOps) {
            onAllSuccess();
          }
        };

        // Move files
        if (fileIds.length > 0) {
          pendingOps++;
          if (fileIds.length === 1) {
            moveFile.mutate(
              { id: fileIds[0], folderId: targetFolder.id, sourceFolderId },
              { onSuccess: checkComplete }
            );
          } else {
            batchMoveFiles.mutate(
              { fileIds, folderId: targetFolder.id, sourceFolderId },
              { onSuccess: checkComplete }
            );
          }
        }

        // Move folders
        if (folderIds.length > 0) {
          pendingOps++;
          if (folderIds.length === 1) {
            moveFolder.mutate(
              { id: folderIds[0], parentId: targetFolder.id, sourceParentId: sourceFolderId },
              { onSuccess: checkComplete }
            );
          } else {
            batchMoveFolders.mutate(
              { folderIds, parentId: targetFolder.id, sourceParentId: sourceFolderId },
              { onSuccess: checkComplete }
            );
          }
        }
      } catch {
        console.error('Failed to parse drag data');
      }
    },
    [moveFile, moveFolder, batchMoveFiles, batchMoveFolders, triggerSuccessFlash]
  );

  const handleDropOnBackground = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDropTargetId(null);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const dragData: MultiDragData = JSON.parse(data);
        const { items, fileIds, folderIds, sourceFolderId } = dragData;
        
        // Don't move if already in current folder
        if (sourceFolderId === currentFolderId) return;

        const totalCount = fileIds.length + folderIds.length;
        const itemName = totalCount === 1 ? items[0].name : `${totalCount} items`;
        const targetName = currentFolderId ? 'current folder' : 'My Drive';

        const onAllSuccess = () => {
          setLastMoveResult({ itemName, targetName });
        };

        let pendingOps = 0;
        let completedOps = 0;

        const checkComplete = () => {
          completedOps++;
          if (completedOps === pendingOps) {
            onAllSuccess();
          }
        };

        // Move files
        if (fileIds.length > 0) {
          pendingOps++;
          if (fileIds.length === 1) {
            moveFile.mutate(
              { id: fileIds[0], folderId: currentFolderId, sourceFolderId },
              { onSuccess: checkComplete }
            );
          } else {
            batchMoveFiles.mutate(
              { fileIds, folderId: currentFolderId, sourceFolderId },
              { onSuccess: checkComplete }
            );
          }
        }

        // Move folders
        if (folderIds.length > 0) {
          pendingOps++;
          if (folderIds.length === 1) {
            moveFolder.mutate(
              { id: folderIds[0], parentId: currentFolderId, sourceParentId: sourceFolderId },
              { onSuccess: checkComplete }
            );
          } else {
            batchMoveFolders.mutate(
              { folderIds, parentId: currentFolderId, sourceParentId: sourceFolderId },
              { onSuccess: checkComplete }
            );
          }
        }
      } catch {
        console.error('Failed to parse drag data');
      }
    },
    [currentFolderId, moveFile, moveFolder, batchMoveFiles, batchMoveFolders]
  );

  const handleBackgroundDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return {
    draggedItem,
    dragCount,
    dropTargetId,
    successFlashId,
    lastMoveResult,
    clearMoveResult,
    isMoving: moveFile.isPending || moveFolder.isPending || batchMoveFiles.isPending || batchMoveFolders.isPending,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnBackground,
    handleBackgroundDragOver,
  };
}
