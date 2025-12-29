// Query key factory for consistent cache management
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Folders
  folders: {
    all: ['folders'] as const,
    list: (parentId?: string | null) => [...queryKeys.folders.all, 'list', parentId ?? 'root'] as const,
    tree: () => [...queryKeys.folders.all, 'tree'] as const,
    detail: (id: string) => [...queryKeys.folders.all, 'detail', id] as const,
    favorites: () => [...queryKeys.folders.all, 'favorites'] as const,
  },

  // Files
  files: {
    all: ['files'] as const,
    list: (folderId?: string | null) => [...queryKeys.files.all, 'list', folderId ?? 'root'] as const,
    detail: (id: string) => [...queryKeys.files.all, 'detail', id] as const,
    search: (query: string) => [...queryKeys.files.all, 'search', query] as const,
    favorites: () => [...queryKeys.files.all, 'favorites'] as const,
  },
};
