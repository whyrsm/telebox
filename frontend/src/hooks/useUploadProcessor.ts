import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUploadStore } from '@/stores/upload.store';
import { filesApi } from '@/lib/api';
import { queryKeys } from '@/lib/queries/keys';

const MAX_CONCURRENT_UPLOADS = 2;

export function useUploadProcessor() {
  const queryClient = useQueryClient();
  const { uploads, updateProgress, setStatus } = useUploadStore();
  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const pendingUploads = uploads.filter(
      (u) => u.status === 'pending' && !processingRef.current.has(u.id)
    );
    const activeCount = uploads.filter((u) => u.status === 'uploading').length;
    const slotsAvailable = MAX_CONCURRENT_UPLOADS - activeCount;

    if (slotsAvailable <= 0 || pendingUploads.length === 0) return;

    const toProcess = pendingUploads.slice(0, slotsAvailable);

    toProcess.forEach((upload) => {
      processingRef.current.add(upload.id);

      filesApi
        .upload(upload.file, upload.folderId, (progress) => {
          updateProgress(upload.id, progress);
        })
        .then(() => {
          setStatus(upload.id, 'success');
          queryClient.invalidateQueries({ queryKey: queryKeys.files.list(upload.folderId) });
        })
        .catch((error) => {
          const message = error?.response?.data?.message || error.message || 'Upload failed';
          setStatus(upload.id, 'error', message);
        })
        .finally(() => {
          processingRef.current.delete(upload.id);
        });
    });
  }, [uploads, updateProgress, setStatus, queryClient]);
}
