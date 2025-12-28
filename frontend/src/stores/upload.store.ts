import { create } from 'zustand';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  folderId?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

interface UploadState {
  uploads: UploadItem[];
  isMinimized: boolean;

  addUploads: (files: File[], folderId?: string) => void;
  updateProgress: (id: string, progress: number) => void;
  setStatus: (id: string, status: UploadStatus, error?: string) => void;
  removeUpload: (id: string) => void;
  clearCompleted: () => void;
  setMinimized: (minimized: boolean) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: [],
  isMinimized: false,

  addUploads: (files, folderId) => {
    const newUploads: UploadItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      folderId,
      progress: 0,
      status: 'pending',
    }));
    set((state) => ({ uploads: [...state.uploads, ...newUploads] }));
  },

  updateProgress: (id, progress) => {
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, progress, status: 'uploading' } : u
      ),
    }));
  },

  setStatus: (id, status, error) => {
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, status, error, progress: status === 'success' ? 100 : u.progress } : u
      ),
    }));
  },

  removeUpload: (id) => {
    set((state) => ({ uploads: state.uploads.filter((u) => u.id !== id) }));
  },

  clearCompleted: () => {
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status !== 'success' && u.status !== 'error'),
    }));
  },

  setMinimized: (minimized) => set({ isMinimized: minimized }),
}));
