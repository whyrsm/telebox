import { create } from 'zustand';

export interface FileItem {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  messageId: string;
  folderId: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  children?: FolderItem[];
}

type ViewMode = 'grid' | 'list';
type DriveView = 'drive' | 'favorites';

interface DriveState {
  // Navigation
  currentFolderId: string | null;
  folderPath: FolderItem[];
  currentView: DriveView;

  // UI state
  selectedItems: Set<string>;
  viewMode: ViewMode;
  searchQuery: string;

  // Actions
  setCurrentFolder: (folderId: string | null, path?: FolderItem[]) => void;
  setCurrentView: (view: DriveView) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  addToPath: (folder: FolderItem) => void;
  navigateToPathIndex: (index: number) => void;
}

export const useDriveStore = create<DriveState>((set, get) => ({
  currentFolderId: null,
  folderPath: [],
  currentView: 'drive',
  selectedItems: new Set(),
  viewMode: 'grid',
  searchQuery: '',

  setCurrentFolder: (folderId, path) => {
    set({
      currentFolderId: folderId,
      folderPath: path || [],
      selectedItems: new Set(),
      searchQuery: '',
      currentView: 'drive',
    });
  },

  setCurrentView: (view) => {
    set({
      currentView: view,
      selectedItems: new Set(),
      searchQuery: '',
    });
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleSelect: (id) => {
    const selected = new Set(get().selectedItems);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    set({ selectedItems: selected });
  },

  selectAll: (ids) => {
    set({ selectedItems: new Set(ids) });
  },

  clearSelection: () => set({ selectedItems: new Set() }),

  addToPath: (folder) => {
    set((state) => ({
      folderPath: [...state.folderPath, folder],
      currentFolderId: folder.id,
      selectedItems: new Set(),
      searchQuery: '',
    }));
  },

  navigateToPathIndex: (index) => {
    set((state) => {
      if (index < 0) {
        return { folderPath: [], currentFolderId: null, selectedItems: new Set() };
      }
      const newPath = state.folderPath.slice(0, index + 1);
      return {
        folderPath: newPath,
        currentFolderId: newPath[newPath.length - 1]?.id || null,
        selectedItems: new Set(),
      };
    });
  },
}));
