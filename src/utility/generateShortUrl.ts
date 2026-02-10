import axios from "axios";
import { TinyUrlResponse } from "../interfaces";
import { logger } from "../logger";
import { config } from "dotenv";
config({ quiet: true });

const TINYURL_API_URL = process.env.TINYURL_API_URL!;
const TINYURL_API_KEY = process.env.TINYURL_API_KEY!;

/**
 * Genera un URL breve utilizzando l'API di TinyURL.
 * @param longUrl L'URL originale da accorciare.
 * @returns L'URL breve generato o l'URL originale in caso di errore.
 */
export const generateShortUrl = async (longUrl: string): Promise<string> => {
  try {
    const response = await axios.post<TinyUrlResponse>(`${TINYURL_API_URL}?api_token=${TINYURL_API_KEY}`, {
      url: longUrl,
    });
    return response.data.data.tiny_url;
  } catch (error) {
    logger.warn(`⚠️ TinyURL error: ${(error as Error).message}`);
    // fallback: restituisce il link originale se TinyURL fallisce
    return longUrl;
  }
};
