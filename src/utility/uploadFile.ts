import axios from "axios";
import { createReadStream } from "fs"; // per createReadStream
import fsp from "fs/promises"; // per stat asincrono
import prettyBytes from "pretty-bytes";
import { fileTypeFromBuffer } from "file-type";
import { nanoid } from "nanoid";
import { logger } from "../logger/logger";

/**
 * Carica un file su filebin.net.
 * @param filePath Il percorso del file da caricare.
 * @param fileName Il nome che il file avrà su filebin.
 * @param binName Il nome del "bin" (cartella) su filebin in cui caricare il file.
 * @returns L'URL del file caricato.
 */
export const uploadFile = async (filePath: string, fileName: string, userId: number): Promise<string> => {
  const binName = `${userId}-${nanoid(8)}`;
  const url = `https://filebin.net/${binName}/${fileName}`;

  try {
    // Crea lo stream del file
    const fileStream = createReadStream(filePath);

    // Ottiene la dimensione del file in modo asincrono
    const stats = await fsp.stat(filePath);
    const fileSize = stats.size;

    // Stabilisce il mimetype controllando il magic number del buffer. Più sicuro.
    const fileBuffer = await fsp.readFile(filePath);
    const fileType = await fileTypeFromBuffer(fileBuffer);
    const mimetype = fileType?.mime || "application/octet-stream";

    logger.info(`Uploading: ${fileName}, Size: ${prettyBytes(fileSize)}, Type: ${mimetype}`);

    // Effettua la richiesta POST con axios
    await axios.post(url, fileStream, {
      headers: {
        "Content-Type": mimetype,
        "Content-Length": fileSize,
        "Accept": "*/*",
      },
    });

    return url;
  } catch (error) {
    throw error;
  }
};
