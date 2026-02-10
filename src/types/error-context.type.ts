export type ErrorContext =
  | { op: "messageHandler"; userId: number; chatId: number; fileName: string }
  | { op: "botStart" }
  | { op: "downloadFile"; fileId: string; fileName: string }
  | { op: "uploadFile"; filePath: string; fileName: string; userId: number; chatId: number }
  | { op: "unknown"; reason?: string };
