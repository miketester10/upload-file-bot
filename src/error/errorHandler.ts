import { isAxiosError } from "axios";
import { logger } from "../logger/logger";

/**
 * Gestisce gli errori, registra i dettagli e restituisce un messaggio di errore user-friendly.
 * @param error L'errore catturato (può essere di tipo sconosciuto).
 * @returns Un messaggio di errore da mostrare all'utente.
 */
export const errorHandler = (error: unknown): string => {
  let defaultMessage = `❌ An error occurred. Please try again.`;

  if (isAxiosError(error)) {
    const message = error.response?.data || error.message;
    if (message.includes("Illegal file extension")) {
      defaultMessage = `⚠️ Illegal file extension.`;
    }
    logger.error(`❌ Axios Error: ${message}`);
  } else {
    const message = (error as Error).message;
    logger.error(`❌ Error: ${message}`);
  }

  return defaultMessage;
};
