import {
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  FileSpreadsheet,
} from 'lucide-react';

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

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please try again.',
  AUTH_FAILED: 'Authentication failed',
  INVALID_CODE: 'Invalid verification code',
  SEND_CODE_FAILED: 'Failed to send code',
  FILE_NOT_FOUND: 'File not found',
  FOLDER_NOT_FOUND: 'Folder not found',
} as const;

export const TELEGRAM = {
  SAVED_MESSAGES: 'me',
  CONNECTION_RETRIES: 5,
  CODE_EXPIRY: '10m',
} as const;
