import { useState, useCallback, DragEvent } from 'react';
import { useMoveFile, useMoveFolder } from '@/lib/queries';
import { FileItem, FolderItem } from '@/stores/drive.store';

export type DragItemType = 'file' | 'folder';

export interface DragItem {
  id: string;
  type: DragItemType;
  name: string;
  sourceFolderId: string | null;
}

export interface MoveResult {
  itemName: string;
  targetName: string;
}

export function useDragAndDrop(currentFolderId: string | null) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [lastMoveResult, setLastMoveResult] = useState<MoveResult | null>(null);
  const [successFlashId, setSuccessFlashId] = useState<string | null>(null);

  const moveFile = useMoveFile();
  const moveFolder = useMoveFolder();

  const triggerSuccessFlash = useCallback((targetId: string) => {
    setSuccessFlashId(targetId);
    setTimeout(() => setSuccessFlashId(null), 600);
  }, []);

  const clearMoveResult = useCallback(() => {
    setLastMoveResult(null);
  }, []);

  const handleDragStart = useCallback(
    (e: DragEvent, item: FileItem | FolderItem, type: DragItemType) => {
      const dragItem: DragItem = {
        id: item.id,
        type,
        name: item.name,
        sourceFolderId: type === 'file' ? (item as FileItem).folderId : (item as FolderItem).parentId,
      };
      
      setDraggedItem(dragItem);
      e.dataTransfer.setData('application/json', JSON.stringify(dragItem));
      e.dataTransfer.effectAllowed = 'move';
      
      // Add a custom drag image (optional enhancement)
      const dragEl = e.currentTarget as HTMLElement;
      dragEl.style.opacity = '0.5';
    },
    []
  );

  const handleDragEnd = useCallback((e: DragEvent) => {
    const dragEl = e.currentTarget as HTMLElement;
    dragEl.style.opacity = '1';
    setDraggedItem(null);
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
      
      // Don't allow dropping a folder into its own child (would create circular reference)
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
    // Only clear if we're leaving the actual target, not entering a child
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
        const item: DragItem = JSON.parse(data);
        
        // Don't move to same location
        if (item.type === 'file' && item.sourceFolderId === targetFolder.id) return;
        if (item.type === 'folder' && item.sourceFolderId === targetFolder.id) return;
        
        // Don't drop folder on itself
        if (item.id === targetFolder.id) return;

        const onSuccess = () => {
          setLastMoveResult({ itemName: item.name, targetName: targetFolder.name });
          triggerSuccessFlash(targetFolder.id);
        };

        if (item.type === 'file') {
          moveFile.mutate(
            { id: item.id, folderId: targetFolder.id, sourceFolderId: item.sourceFolderId },
            { onSuccess }
          );
        } else {
          moveFolder.mutate(
            { id: item.id, parentId: targetFolder.id, sourceParentId: item.sourceFolderId },
            { onSuccess }
          );
        }
      } catch {
        console.error('Failed to parse drag data');
      }
    },
    [moveFile, moveFolder, triggerSuccessFlash]
  );

  // Handle drop on the main area (move to root/current folder)
  const handleDropOnBackground = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDropTargetId(null);

      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      try {
        const item: DragItem = JSON.parse(data);
        
        // Don't move if already in current folder
        if (item.sourceFolderId === currentFolderId) return;

        const targetName = currentFolderId ? 'current folder' : 'My Drive';
        const onSuccess = () => {
          setLastMoveResult({ itemName: item.name, targetName });
        };

        if (item.type === 'file') {
          moveFile.mutate(
            { id: item.id, folderId: currentFolderId, sourceFolderId: item.sourceFolderId },
            { onSuccess }
          );
        } else {
          moveFolder.mutate(
            { id: item.id, parentId: currentFolderId, sourceParentId: item.sourceFolderId },
            { onSuccess }
          );
        }
      } catch {
        console.error('Failed to parse drag data');
      }
    },
    [currentFolderId, moveFile, moveFolder]
  );

  const handleBackgroundDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  return {
    draggedItem,
    dropTargetId,
    successFlashId,
    lastMoveResult,
    clearMoveResult,
    isMoving: moveFile.isPending || moveFolder.isPending,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnBackground,
    handleBackgroundDragOver,
  };
}
