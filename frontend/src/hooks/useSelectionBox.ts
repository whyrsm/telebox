import { useState, useCallback, useRef, useEffect } from 'react';
import { useDriveStore } from '@/stores/drive.store';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface UseSelectionBoxOptions {
  containerRef: React.RefObject<HTMLElement>;
  itemSelector: string;
}

export function useSelectionBox({ containerRef, itemSelector }: UseSelectionBoxOptions) {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const initialSelectedRef = useRef<Set<string>>(new Set());
  const { selectAll, clearSelection, selectedItems } = useDriveStore();

  const getItemsInBox = useCallback((box: SelectionBox): string[] => {
    if (!containerRef.current) return [];

    const items = containerRef.current.querySelectorAll(itemSelector);
    const selectedIds: string[] = [];
    const containerRect = containerRef.current.getBoundingClientRect();

    // Normalize box coordinates (box is in container-relative coordinates)
    const boxLeft = Math.min(box.startX, box.endX);
    const boxRight = Math.max(box.startX, box.endX);
    const boxTop = Math.min(box.startY, box.endY);
    const boxBottom = Math.max(box.startY, box.endY);

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();

      // Get item position relative to container's viewport position
      const itemLeft = rect.left - containerRect.left;
      const itemRight = rect.right - containerRect.left;
      const itemTop = rect.top - containerRect.top;
      const itemBottom = rect.bottom - containerRect.top;

      // Check if item intersects with selection box
      const intersects =
        itemLeft < boxRight &&
        itemRight > boxLeft &&
        itemTop < boxBottom &&
        itemBottom > boxTop;

      if (intersects) {
        const id = item.getAttribute('data-item-id');
        if (id) selectedIds.push(id);
      }
    });

    return selectedIds;
  }, [containerRef, itemSelector]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on left click and on background
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-file-item]') || target.closest('[data-folder-item]')) {
      return;
    }

    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    startPointRef.current = { x, y };
    
    // Store initial selection for additive mode
    if (e.ctrlKey || e.metaKey) {
      initialSelectedRef.current = new Set(selectedItems);
    } else {
      initialSelectedRef.current = new Set();
      clearSelection();
    }

    setIsSelecting(true);
    setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
  }, [containerRef, clearSelection, selectedItems]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !startPointRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    const newBox = {
      startX: startPointRef.current.x,
      startY: startPointRef.current.y,
      endX: x,
      endY: y,
    };

    setSelectionBox(newBox);

    // Update selection in real-time
    const itemsInBox = getItemsInBox(newBox);
    
    // Merge with initial selection for additive mode
    const merged = new Set([...initialSelectedRef.current, ...itemsInBox]);
    selectAll(Array.from(merged));
  }, [isSelecting, containerRef, getItemsInBox, selectAll]);

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setSelectionBox(null);
    startPointRef.current = null;
  }, []);

  // Handle mouse up outside the container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        handleMouseUp();
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting, handleMouseUp]);

  // Handle mouse move outside the container
  useEffect(() => {
    if (!isSelecting) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !startPointRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      const newBox = {
        startX: startPointRef.current.x,
        startY: startPointRef.current.y,
        endX: x,
        endY: y,
      };

      setSelectionBox(newBox);

      const itemsInBox = getItemsInBox(newBox);
      const merged = new Set([...initialSelectedRef.current, ...itemsInBox]);
      selectAll(Array.from(merged));
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isSelecting, containerRef, getItemsInBox, selectAll]);

  const selectionBoxStyle = selectionBox
    ? {
        position: 'absolute' as const,
        left: Math.min(selectionBox.startX, selectionBox.endX),
        top: Math.min(selectionBox.startY, selectionBox.endY),
        width: Math.abs(selectionBox.endX - selectionBox.startX),
        height: Math.abs(selectionBox.endY - selectionBox.startY),
        backgroundColor: 'var(--accent-color)',
        opacity: 0.15,
        border: '1px solid var(--accent-color)',
        pointerEvents: 'none' as const,
        zIndex: 50,
      }
    : null;

  return {
    selectionBox,
    selectionBoxStyle,
    isSelecting,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
