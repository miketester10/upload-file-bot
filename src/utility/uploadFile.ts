import got from "got";
import { createReadStream } from "fs";
import fsp from "fs/promises";
import progress from "progress-stream";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { fileTypeFromFile } from "file-type";
import { nanoid } from "nanoid";
import { logger } from "../logger/logger";

/**
 * Carica un file su filebin.net con upload streaming reale.
 * Logga percentuale, velocità, ETA e byte trasferiti.
 *
 * @param filePath Percorso del file da caricare
 * @param fileName Nome che il file avrà su filebin
 * @param userId ID utente (usato per il bin)
 * @returns URL del file caricato
 */
export const uploadFile = async (filePath: string, fileName: string, userId: number): Promise<string> => {
  const binName = `${userId}-${nanoid(8)}`;
  const encodedFileName = encodeURIComponent(fileName);
  const url = `https://filebin.net/${binName}/${encodedFileName}`;

  try {
    /**
     * Recupera dimensione file (async, non blocca event loop)
     */
    const { size: fileSize } = await fsp.stat(filePath);

    /**
     * Determina il MIME type leggendo il magic number dal file
     * (senza caricare l'intero file in memoria)
     */
    const fileType = await fileTypeFromFile(filePath);
    const mimetype = fileType?.mime ?? "application/octet-stream";

    logger.info(`Uploading: ${fileName} | Size: ${prettyBytes(fileSize)} | Type: ${mimetype}`);

    /**
     * Stream di lettura del file
     * NON legge nulla finché qualcuno non consuma i dati
     */
    const fileStream = createReadStream(filePath);

    /**
     * Stream intermedio che misura:
     * - percentuale
     * - velocità reale
     * - ETA
     * - byte trasferiti
     */
    const progStream = progress({
      length: fileSize,
      time: 100, // update ogni 100ms
    });

    progStream.on("progress", (p) => {
      const percent = Math.round(p.percentage);
      const transferred = prettyBytes(p.transferred);
      const speed = `${prettyBytes(p.speed)}/s`;
      const eta = prettyMs(p.eta * 1000);

      logger.info(`${percent}% | ${transferred} | ${speed} | ETA ${eta}`);
    });

    /**
     * got.stream.post restituisce un Writable stream
     * I chunk vengono scritti direttamente sul socket HTTP
     */
    const uploadStream = got.stream.post(url, {
      headers: {
        "Content-Type": mimetype,
        "Content-Length": fileSize,
        Accept: "*/*",
      },
    });

    /**
     * PIPE FONDAMENTALE:
     * file → progress → socket
     *
     * Senza questa pipe:
     * - il file non viene letto
     * - l'upload non parte
     * - il progress non esiste
     */
    fileStream.pipe(progStream).pipe(uploadStream);

    /**
     * Attende la risposta del server
     */
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("response", (res) => {
        logger.info(`Upload completato ✔️  Status ${res.statusCode}`);
        resolve();
      });

      uploadStream.on("error", (err) => {
        reject(err);
      });
    });

    return url;
  } catch (error) {
    logger.error(`Errore durante l'upload di ${fileName}: ${(error as Error).message}`);
    throw error;
  }
};
