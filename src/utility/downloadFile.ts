import axios from "axios";
import { logger } from "../logger";
import { config } from "dotenv";
import { GetFileResponse } from "../interfaces/get-file-response.interface";
import { prepareFilePath } from "./prepareFilePath";
config({ quiet: true });

const BOT_TOKEN = process.env.BOT_TOKEN!;

export const downloadFile = async (fileId: string, fileName: string): Promise<string> => {
  try {
    const getFileUrl = `http://localhost:8081/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
    const getFileResponse = await axios.get<GetFileResponse>(getFileUrl);
    const dockerPath = getFileResponse.data.result.file_path; // Percorso del file all'interno del container Docker

    const finalPath = prepareFilePath(dockerPath, fileName, BOT_TOKEN);

    return finalPath;
  } catch (error) {
    logger.error(`❌ Errore durante il download: ${(error as Error).message}`);
    throw error;
  }
};
