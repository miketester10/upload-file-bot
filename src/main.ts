import { blockquote, bold, Bot, code, format, italic, underline, strikethrough } from "gramio";
import { config } from "dotenv";
import { uploadFile } from "./utility/uploadFile";
import { logger } from "./logger/logger";
import { errorHandler } from "./error/errorHandler";
import { prepareFilePath } from "./utility/prepareFilePath";
import { cleanupFile } from "./utility/cleanupFile";
config({ quiet: true });

const BOT_TOKEN = process.env.BOT_TOKEN!;
const LOCAL_BOT_API = process.env.LOCAL_BOT_API!;

const bot = new Bot(BOT_TOKEN, { api: { baseURL: LOCAL_BOT_API } });

// Gestionre comando /start
bot.command("start", async (ctx) => {
  const telegramId = ctx.from?.id!;
  const name = ctx.from?.firstName!;
  const username = ctx.from?.username || "N/A";

  logger.info(`Bot avviato da: ${name} -  Username: ${username} - Telegram ID: ${telegramId}`);

  const message = format`
      👋 Hey ${name}

      ✨ I'm a bot that helps you upload files and share them easily.
      Send me a file, and I'll give you a download link ✨

      ${blockquote(`⚠️ For more information contact the developer:\n@m1keehrmantraut`)}
    `;
  await ctx.reply(message);
});

// Gestione dei messaggi con file
bot.on("message", async (ctx) => {
  // Controllo che il file è presente nel messaggio inviato e che abbia un nome
  const file = ctx.document;
  if (!file) return;
  if (!file.fileName) {
    return await ctx.reply(format`${code(`❌ File must have a name.`)}`);
  }

  // Messaggio di stato
  const statusMessage = await ctx.reply(format`${bold(`[ ⏳ ] Download file...`)}`);

  let finalPath: string | undefined;
  try {
    // Download del file dall' API locale di Telegram (server locale avviato con docker)
    const downloadedFile = await bot.api.getFile({ file_id: file.fileId });

    // Costruisce il percorso finale e rinomina il file
    finalPath = await prepareFilePath(downloadedFile.file_path!, file.fileName, BOT_TOKEN);

    // Aggiorna messaggio di stato
    await ctx.editMessageText(format`[✅] ${strikethrough(`Download file`)}\n${bold(`[ ⏳ ] Upload file...`)}`, { chat_id: ctx.chat.id, message_id: statusMessage.id });

    // Upload del file (filebin.net)
    const url = await uploadFile(finalPath, file.fileName);

    // Aggiorna messaggio di stato
    await ctx.editMessageText(format`[✅] ${strikethrough(`Download file`)}\n[✅] ${strikethrough(`Upload file`)}\n\n${italic(underline(`🔗 Here's the link:`))}\n${url}`, {
      chat_id: ctx.chat.id,
      message_id: statusMessage.id,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    // Gestione dell'errore
    const errorMessage = errorHandler(error);
    await ctx.editMessageText(format`${code(errorMessage)}`, { chat_id: ctx.chat.id, message_id: statusMessage.id });
  } finally {
    // Cleanup: elimina il file locale se esiste
    await cleanupFile(finalPath);
  }
});

// Avvia il bot
(async () => {
  try {
    await bot.start();
    logger.info("✅ Bot avviato con successo");
  } catch (error) {
    logger.error(`❌ Errore durante l'avvio del bot: ${(error as Error).message}`);
  }
})();
