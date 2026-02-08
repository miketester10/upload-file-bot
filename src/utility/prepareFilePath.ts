import { join } from "path";
import fsp from "fs/promises";
import { existsSync } from "fs";

const CONTAINER_DATA_PATH = join(process.cwd(), "container_data");
if (!existsSync(CONTAINER_DATA_PATH)) {
  throw new Error(`La cartella 📂 "container_data" non esiste`);
}

/**
 * Costruisce il percorso del file, rinomina il file scaricato con il suo nome originale
 * e lo sposta nella cartella dei documenti del bot.
 * @param downloadedFilePath Il percorso del file scaricato dall'API Telegram locale
 * @param originalName Il nome originale del file.
 * @param botToken Il token del bot.
 * @returns Il percorso finale del file rinominato.
 */
export async function prepareFilePath(downloadedFilePath: string, originalName: string, botToken: string): Promise<string> {
  /** 
  * Il percorso interno del container dell'API Telegram locale è:
  * /var/lib/telegram-bot-api/<BOT_TOKEN>/documents/file_5.jpg
  * Dobbiamo quindi puntare al percorso corrispondente sul filesystem host:
  * ./container_data/<BOT_TOKEN>/documents/file_5.jpg
  * La cartella ./container_data è montata come volume nel container
  */
  const relativePathParts = downloadedFilePath.split("/").slice(4); // rimuove /var/lib/telegram-bot-api
  const hostFilePath = join(CONTAINER_DATA_PATH, ...relativePathParts);

  // Percorso finale dove salvare il file con nome originale
  const finalPath = join(CONTAINER_DATA_PATH, botToken, "documents", originalName);

  // Rinomina il file con il nome originale
  await fsp.rename(hostFilePath, finalPath);

  return finalPath;
}
