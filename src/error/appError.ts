import { ErrorContext } from "../types";

/**
 * Classe di errore personalizzata che estende la classe Error nativa di JavaScript.
 * Include un contesto aggiuntivo per fornire informazioni dettagliate sull'errore.
 * Può anche accettare una causa (cause) per tracciare l'origine dell'errore.
 * @param message Il messaggio di errore da visualizzare.
 * @param context Un oggetto che contiene informazioni contestuali sull'errore (ad esempio, operazione, fileId, ecc.).
 * @param cause Un errore originale che ha causato questo errore (opzionale).
 */
export class AppError<T extends ErrorContext = ErrorContext> extends Error {
  override name = "AppError";

  constructor(
    message: string,
    public readonly rootContext: T,
    public readonly rootError: unknown,
  ) {
    super(message);
  }
}
