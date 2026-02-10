import fsp from "fs/promises";
import { existsSync } from "fs";
import { logger } from "../logger/logger";

/**
 * Elimina un file locale se esiste, gestendo eventuali errori.
 * @param filePath Il percorso del file da eliminare.
 */
export async function cleanupFile(filePath: string | undefined): Promise<void> {
  if (filePath && existsSync(filePath)) {
    try {
      await fsp.unlink(filePath);
    } catch (error) {
      logger.error(`❌ Errore durante l'eliminazione del file: ${(error as Error).message}`);
    }
  } else {
    logger.debug(`File non trovato per l'eliminazione: ${filePath}`);
  }
}
