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
    mutationFn: ({ id, folderId }: { id: string; folderId?: string | null }) =>
      filesApi.move(id, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      filesApi.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.all });
    },
  });
}
