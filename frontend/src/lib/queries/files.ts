import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { filesApi } from '@/lib/api';
import { queryKeys } from './keys';
import type { FileItem } from '@/stores/drive.store';

// Queries
export function useFiles(folderId?: string | null) {
  return useQuery({
    queryKey: queryKeys.files.list(folderId),
    queryFn: async () => {
      const { data } = await filesApi.list(folderId);
      return data as FileItem[];
    },
  });
}

export function useFileSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.files.search(query),
    queryFn: async () => {
      const { data } = await filesApi.search(query);
      return data as FileItem[];
    },
    enabled: query.trim().length > 0,
  });
}

// Mutations
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      folderId,
      onProgress,
    }: {
      file: File;
      folderId?: string;
      onProgress?: (progress: number) => void;
    }) => filesApi.upload(file, folderId, onProgress),
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(folderId) });
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async (file: FileItem) => {
      const response = await filesApi.download(file.id);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function useMoveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId?: string | null; sourceFolderId?: string | null }) =>
      filesApi.move(id, folderId),
    onSuccess: (_, { folderId, sourceFolderId }) => {
      // Invalidate both source and destination folders
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(sourceFolderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(folderId) });
    },
  });
}

export function useBatchMoveFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileIds, folderId }: { fileIds: string[]; folderId?: string | null; sourceFolderId?: string | null }) =>
      filesApi.batchMove(fileIds, folderId),
    onSuccess: (_, { folderId, sourceFolderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(sourceFolderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(folderId) });
    },
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string; folderId?: string | null }) =>
      filesApi.rename(id, name),
    onSuccess: (_, { folderId }) => {
      // Only invalidate the specific folder's file list
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(folderId) });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; folderId?: string | null }) => filesApi.delete(id),
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.trash() });
    },
  });
}

export function useFavoriteFiles() {
  return useQuery({
    queryKey: queryKeys.files.favorites(),
    queryFn: async () => {
      const { data } = await filesApi.favorites();
      return data as FileItem[];
    },
  });
}

export function useTrashedFiles() {
  return useQuery({
    queryKey: queryKeys.files.trash(),
    queryFn: async () => {
      const { data } = await filesApi.trash();
      return data as FileItem[];
    },
  });
}

export function useToggleFileFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; folderId?: string | null }) =>
      filesApi.toggleFavorite(id),
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.list(folderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.favorites() });
    },
  });
}

export function useRestoreFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filesApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.trash() });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}

export function usePermanentDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filesApi.permanentDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.trash() });
    },
  });
}

export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => filesApi.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.trash() });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.trash() });
    },
  });
}
