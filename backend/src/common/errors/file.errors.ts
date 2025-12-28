export class FileUploadError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileUploadError';
  }
}

export class FileDownloadError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'FileDownloadError';
  }
}

export class TelegramApiError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TelegramApiError';
  }
}
