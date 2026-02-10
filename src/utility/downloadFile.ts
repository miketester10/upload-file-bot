import axios from "axios";
import { AppError } from "../error";
import { ErrorOperation } from "../types";
import { GetFileResponse } from "../interfaces/get-file-response.interface";
import { prepareFilePath } from "./prepareFilePath";
import { config } from "dotenv";
config({ quiet: true });

const BOT_TOKEN = process.env.BOT_TOKEN!;
const LOCAL_BOT_API = process.env.LOCAL_BOT_API!;

/**
 * Scarica un file dall'API di Telegram, rinomina il file scaricato con il suo nome originale
 * e lo sposta nella cartella dei documenti del bot.
 * @param fileId L'ID del file da scaricare.
 * @param fileName Il nome originale del file.
 * @returns Il percorso finale del file rinominato.
 */
export const downloadFile = async (fileId: string, fileName: string): Promise<string> => {
  try {
    const getFileUrl = `${LOCAL_BOT_API}${BOT_TOKEN}/getFile?file_id=${fileId}`;
    const getFileResponse = await axios.get<GetFileResponse>(getFileUrl);
    const dockerPath = getFileResponse.data.result.file_path; // Percorso del file all'interno del container Docker

    const finalPath = prepareFilePath(dockerPath, fileName, BOT_TOKEN);

    return finalPath;
  } catch (error) {
    throw new AppError("Download failed", { op: ErrorOperation.DOWNLOAD_FILE, fileId, fileName }, error);
  }
};
