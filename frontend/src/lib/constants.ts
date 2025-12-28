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
  // Network errors
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  SERVER_UNAVAILABLE: 'The server is temporarily unavailable. Please try again in a moment.',
  
  // Auth errors
  AUTH_FAILED: 'Authentication failed. Please try signing in again.',
  INVALID_CODE: 'The verification code is incorrect. Please check and try again.',
  CODE_EXPIRED: 'Your verification session has expired. Please request a new code.',
  SEND_CODE_FAILED: 'Unable to send verification code. Please check your phone number and try again.',
  INVALID_PHONE: 'Please enter a valid phone number with country code (e.g., +621234567).',
  PHONE_FLOOD: 'Too many attempts. Please wait a few minutes before trying again.',
  
  // File errors
  FILE_NOT_FOUND: 'File not found',
  FOLDER_NOT_FOUND: 'Folder not found',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  DOWNLOAD_FAILED: 'Failed to download file. Please try again.',
} as const;

// Map backend error messages to user-friendly messages
export const mapErrorMessage = (backendMessage?: string): string => {
  if (!backendMessage) return ERROR_MESSAGES.NETWORK_ERROR;
  
  const message = backendMessage.toLowerCase();
  
  if (message.includes('invalid or expired verification')) {
    return ERROR_MESSAGES.CODE_EXPIRED;
  }
  if (message.includes('invalid verification code')) {
    return ERROR_MESSAGES.INVALID_CODE;
  }
  if (message.includes('phone_number_invalid') || message.includes('invalid phone')) {
    return ERROR_MESSAGES.INVALID_PHONE;
  }
  if (message.includes('flood') || message.includes('too many')) {
    return ERROR_MESSAGES.PHONE_FLOOD;
  }
  if (message.includes('network') || message.includes('econnrefused')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // Return original message if no mapping found
  return backendMessage;
};

export const TELEGRAM = {
  SAVED_MESSAGES: 'me',
  CONNECTION_RETRIES: 5,
  CODE_EXPIRY: '10m',
} as const;
