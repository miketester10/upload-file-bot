import got, { GotError } from "got";
import { createReadStream } from "fs";
import fsp from "fs/promises";
import progress from "progress-stream";
import prettyBytes from "pretty-bytes";
import prettyMs from "pretty-ms";
import { fileTypeFromFile } from "file-type";
import { nanoid } from "nanoid";
import { logger } from "../logger/logger";
import { renderProgressBar } from "./renderProgressBar";
import { MyMessageContext } from "../interfaces";
import { bold, code, format } from "gramio";
import { IncomingMessage } from "http";
import { generateShortUrl } from "./generateShortUrl";
import { AppError } from "../error";
import { ErrorOperation } from "../types";

/**
 * Carica un file su filebin.net con upload streaming reale.
 * Logga percentuale, velocità, ETA e byte trasferiti.
 *
 * @param filePath Percorso del file da caricare
 * @param fileName Nome che il file avrà su filebin
 * @param userId ID utente Telegram
 * @param chatId ID chat Telegram
 * @param messageId ID del messaggio di stato da aggiornare su Telegram durante l'upload
 * @param ctx Context di Telegram per aggiornare il messaggio di stato
 * @returns URL del file caricato
 */
export const uploadFile = async (filePath: string, fileName: string, userId: number, chatId: number, messageId: number, ctx: MyMessageContext): Promise<string> => {
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
    const fileReadStream = createReadStream(filePath);

    /**
     * Stream intermedio che misura:
     * - percentuale
     * - velocità reale
     * - ETA
     * - byte trasferiti
     */
    const progressStream = progress({
      length: fileSize,
      time: 600, // update ogni 600ms
    });

    progressStream.on("progress", async (p) => {
      const percentage = Math.round(p.percentage);
      const transferred = prettyBytes(p.transferred);
      const speed = `${prettyBytes(p.speed)}/s`;
      const eta = prettyMs(p.eta * 1000);
      const bar = renderProgressBar(percentage);

      // Aggiorna il messaggio di stato su Telegram con le nuove informazioni di progresso ogni 600ms (per evitare rate limit di Telegram, non scendere sotto i 500ms)
      await ctx
        .editMessageText(format`${bold("[ ⬆️ ] Upload File")}\n\n${code(`${bar}\n${percentage}% | ${transferred} | ${speed} | ETA: ${eta}`)}`, {
          chat_id: chatId,
          message_id: messageId,
        })
        .catch((err) => {}); // Ignora errori di edit (es. Bad Request: message is not modified)
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
    fileReadStream.pipe(progressStream).pipe(uploadStream);

    /**
     * Attende la risposta del server
     */
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("response", (res: IncomingMessage) => {
        logger.info(`[${res.statusCode ?? "Unknown"}] Upload completato ✔️`);
        resolve();
      });

      uploadStream.on("error", (err: GotError) => {
        reject(err);
      });
    });

    return generateShortUrl(url);
  } catch (error) {
    throw new AppError("Upload failed", { op: ErrorOperation.UPLOAD_FILE, filePath, fileName, userId, chatId }, error);
  }
};
