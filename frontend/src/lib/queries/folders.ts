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
    mutationFn: ({ id, name }: { id: string; name: string; parentId?: string | null }) =>
      foldersApi.update(id, name),
    onSuccess: (_, { parentId }) => {
      // Only invalidate the specific parent folder's list and tree
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.tree() });
    },
  });
}

export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId?: string | null; sourceParentId?: string | null }) =>
      foldersApi.move(id, parentId),
    onSuccess: (_, { parentId, sourceParentId }) => {
      // Invalidate both source and destination parent folders
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(sourceParentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.tree() });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; parentId?: string | null }) => foldersApi.delete(id),
    onSuccess: (_, { parentId }) => {
      // Only invalidate the specific parent folder's list and tree
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(parentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.tree() });
    },
  });
}
