import { HTTPError } from "got";
import { logger } from "../logger/logger";

/**
 * Gestisce gli errori, registra i dettagli e restituisce un messaggio di errore user-friendly.
 * @param error L'errore catturato.
 * @returns Un messaggio di errore da mostrare all'utente.
 */
export const errorHandler = (error: unknown): string => {
  let defaultMessage = `❌ An error occurred. Please try again.`;

  try {
    if (error instanceof HTTPError) {
      const status = error.response?.statusCode ?? "N/A";
      const code = error.code ?? "N/A";
      const message = error.response?.body || error.message;

      if (typeof message === "string" && message.includes("Illegal file extension")) {
        defaultMessage = `⚠️ File extension not allowed.`;
      }

      logger.error(`❌ Got HTTP Error [${status} - ${code}]:`);
      logger.error(message);
    } else if (error instanceof Error) {
      logger.error(`❌ Error: ${error.message}`);
    } else {
      logger.error(`❌ Unknown error:`);
      logger.error(error);
    }
  } catch (logError) {
    // Se c'è un errore durante la gestione dell'errore, logga quello invece di far crashare tutto
    logger.error(`❌ Error while handling error:`);
    logger.error(logError);
  }

  return defaultMessage;
};
