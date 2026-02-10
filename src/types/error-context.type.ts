export enum ErrorOperation {
  MESSAGE_HANDLER = "messageHandler",
  BOT_START = "botStart",
  DOWNLOAD_FILE = "downloadFile",
  UPLOAD_FILE = "uploadFile",
  UNKNOWN = "unknown",
}

export type ErrorContext =
  | { op: ErrorOperation.MESSAGE_HANDLER; userId: number; chatId: number; fileName: string }
  | { op: ErrorOperation.BOT_START }
  | { op: ErrorOperation.DOWNLOAD_FILE; fileId: string; fileName: string }
  | { op: ErrorOperation.UPLOAD_FILE; filePath: string; fileName: string; userId: number; chatId: number }
  | { op: ErrorOperation.UNKNOWN; reason?: string };
