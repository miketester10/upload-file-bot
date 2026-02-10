import { isAxiosError } from "axios";
import { HTTPError } from "got";
import { logger } from "../logger/logger";
import { ErrorContext } from "../types";
import { AppError } from "./appError";

/**
 * Gestisce gli errori in modo uniforme.
 * Logga l'errore con contesto e restituisce un messaggio user-friendly.
 * @param error L'errore da gestire.
 * @param errorContext Contesto aggiuntivo per il logging dell'errore.
 * @returns Un messaggio user-friendly da mostrare all'utente.
 */
export const handleError = (error: unknown, errorContext: ErrorContext): string => {
  let userErrorMessage = "❌ An error occurred. Please try again.";

  try {
    const origin = error instanceof AppError ? error.context : undefined;
    const rootError = error instanceof AppError ? error.rootError : error;
    const logContext = origin ? { context: errorContext, origin } : { context: errorContext };

    if (isAxiosError(rootError)) {
      logger.error({ err: rootError, status: rootError.response?.status, ...logContext }, "Axios error");
    } else if (rootError instanceof HTTPError) {
      logger.error({ err: rootError, status: rootError.response?.statusCode, ...logContext }, "HTTP error (got)");

      if (typeof rootError.response?.body === "string" && rootError.response.body.includes("Illegal file extension")) {
        userErrorMessage = "⚠️ File extension not allowed.";
      }
    } else if (rootError instanceof Error) {
      logger.error({ err: rootError, ...logContext }, "Generic error");
    } else {
      logger.error({ err: rootError, ...logContext }, "Unknown error");
    }
  } catch (e) {
    logger.error({ err: e }, "Error while handling error");
  }

  return userErrorMessage;
};
