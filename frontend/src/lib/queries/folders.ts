import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '@/lib/api';
import { queryKeys } from './keys';
import type { FolderItem } from '@/stores/drive.store';

// Queries
export function useFolders(parentId?: string | null) {
  return useQuery({
    queryKey: queryKeys.folders.list(parentId),
    queryFn: async () => {
      const { data } = await foldersApi.list(parentId);
      return data as FolderItem[];
    },
  });
}

export function useFolderTree() {
  return useQuery({
    queryKey: queryKeys.folders.tree(),
    queryFn: async () => {
      const { data } = await foldersApi.tree();
      return data as FolderItem[];
    },
  });
}

// Mutations
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      foldersApi.create(name, parentId),
    onSuccess: (_, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.tree() });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      foldersApi.update(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
    },
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId?: string | null }) =>
      foldersApi.move(id, parentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => foldersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.all });
    },
  });
}
