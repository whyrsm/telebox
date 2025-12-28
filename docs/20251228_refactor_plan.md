# Refactor Plan

Based on the maintainable code best practices review, here are the identified issues and recommended improvements.

## Priority: High

### 1. DRY Violation: Duplicate Icon Mapping (FileGrid.tsx & FileList.tsx)

**Issue:** `iconMap` is duplicated in both components.

**Files:** 
- `frontend/src/components/files/FileGrid.tsx`
- `frontend/src/components/files/FileList.tsx`

**Solution:** Extract to shared constant in `frontend/src/lib/constants.ts`

```typescript
// frontend/src/lib/constants.ts
export const FILE_ICON_MAP: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  archive: Archive,
  doc: FileText,
  sheet: FileSpreadsheet,
  file: File,
};
```

---

### 2. DRY Violation: Duplicate Click/DoubleClick Handlers

**Issue:** `handleClick` and `handleDoubleClick` logic is duplicated in FileGrid and FileList.

**Solution:** Create a custom hook `useFileItemHandlers`

```typescript
// frontend/src/hooks/useFileItemHandlers.ts
export function useFileItemHandlers(
  onFolderOpen: (folder: FolderItem) => void,
  onFileOpen: (file: FileItem) => void
) {
  const { toggleSelect } = useDriveStore();
  
  const handleClick = (e: React.MouseEvent, id: string) => {
    if (e.ctrlKey || e.metaKey) toggleSelect(id);
  };
  
  const handleDoubleClick = (item: FileItem | FolderItem, type: 'file' | 'folder') => {
    type === 'folder' ? onFolderOpen(item as FolderItem) : onFileOpen(item as FileItem);
  };
  
  return { handleClick, handleDoubleClick };
}
```

---

### 3. Type Safety: Using `any` Type

**Issue:** Multiple uses of `any` type violate TypeScript best practices.

**Files & Locations:**
- `backend/src/files/files.service.ts` - `serializeFile(file: any)`
- `backend/src/folders/folders.service.ts` - `buildTree(folders: any[])`
- `frontend/src/pages/Login.tsx` - `catch (err: any)`

**Solution:** Define proper interfaces

```typescript
// Backend: Define serialized file type
interface SerializedFile {
  id: string;
  name: string;
  size: string;
  mimeType: string;
  messageId: string;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Frontend: Use AxiosError type
import { AxiosError } from 'axios';
catch (error) {
  const axiosError = error as AxiosError<{ message: string }>;
  setError(axiosError.response?.data?.message || 'Failed to send code');
}
```

---

## Priority: Medium

### 4. Large Component: Drive.tsx (~150 lines)

**Issue:** DrivePage has too many responsibilities - state management, event handlers, and rendering.

**Solution:** Extract handlers into custom hook

```typescript
// frontend/src/hooks/useDriveActions.ts
export function useDriveActions() {
  // Move all mutations and handlers here
  return {
    handleUpload,
    handleCreateFolder,
    handleRename,
    handleDelete,
    // ...
  };
}
```

---

### 5. Missing Error Handling: Backend Services

**Issue:** Some operations don't handle errors gracefully.

**Files:**
- `backend/src/files/files.service.ts` - `upload()` doesn't handle Telegram API failures
- `backend/src/telegram/telegram.service.ts` - `downloadFile()` throws generic Error

**Solution:** Create custom error classes

```typescript
// backend/src/common/errors/file.errors.ts
export class FileUploadError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export class TelegramApiError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TelegramApiError';
  }
}
```

---

### 6. Magic Strings: Hardcoded Values

**Issue:** Hardcoded strings scattered throughout the code.

**Examples:**
- `'me'` in TelegramService (Saved Messages reference)
- CSS variable names repeated everywhere
- Error messages duplicated

**Solution:** Create constants files

```typescript
// backend/src/common/constants.ts
export const TELEGRAM = {
  SAVED_MESSAGES: 'me',
  CONNECTION_RETRIES: 5,
} as const;

// frontend/src/lib/constants.ts
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please try again.',
  AUTH_FAILED: 'Authentication failed',
} as const;
```

---

### 7. Missing Loading States in ContextMenu

**Issue:** Delete operation doesn't show loading state.

**Solution:** Add loading prop and disable button during operation

---

## Priority: Low

### 8. Inconsistent Return Types

**Issue:** Some functions return different shapes.

**Example:** `filesService.remove()` returns `{ success: true }` while `foldersService.remove()` returns the deleted folder.

**Solution:** Standardize to return consistent response shapes

---

### 9. Missing JSDoc for Public APIs

**Issue:** API functions lack documentation.

**Solution:** Add JSDoc comments to exported functions

```typescript
/**
 * Uploads a file to Telegram Saved Messages
 * @param userId - The authenticated user's ID
 * @param file - The file to upload
 * @param folderId - Optional folder to place the file in
 * @returns The created file record
 * @throws FileUploadError if upload fails
 */
async upload(userId: string, file: Express.Multer.File, folderId?: string)
```

---

### 10. TypeScript Config Issue

**Issue:** `frontend/src/lib/api.ts` shows error for `import.meta.env`

**Solution:** Ensure `vite-env.d.ts` is properly configured

```typescript
// frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## Refactor Order

1. **Phase 1 - Quick Wins** (1-2 hours)
   - Extract `iconMap` to constants
   - Fix `any` types
   - Fix TypeScript config issue

2. **Phase 2 - DRY Improvements** (2-3 hours)
   - Create `useFileItemHandlers` hook
   - Create `useDriveActions` hook
   - Extract constants

3. **Phase 3 - Error Handling** (2-3 hours)
   - Create custom error classes
   - Add proper error handling to services
   - Add loading states to UI

4. **Phase 4 - Documentation** (1-2 hours)
   - Add JSDoc to public APIs
   - Standardize return types

---

## Summary

| Category | Count |
|----------|-------|
| High Priority | 3 |
| Medium Priority | 4 |
| Low Priority | 3 |
| **Total Issues** | **10** |

The codebase is generally well-structured. Main improvements focus on reducing duplication, improving type safety, and standardizing error handling.
