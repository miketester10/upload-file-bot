import { blockquote, bold, Bot, code, format, italic, underline, strikethrough } from "gramio";
import { FRAMES, AnimationController, prepareFilePath, uploadFile, cleanupFile } from "./utility";
import { errorHandler } from "./error";
import { logger } from "./logger";
import { config } from "dotenv";
config({ quiet: true });

const BOT_TOKEN = process.env.BOT_TOKEN!;
const LOCAL_BOT_API = process.env.LOCAL_BOT_API!;

const bot = new Bot(BOT_TOKEN, { api: { baseURL: LOCAL_BOT_API } });

// Gestionre comando /start
bot.command("start", async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.firstName;
  const username = ctx.from.username || "N/A";

  logger.info(`Bot avviato da: ${name} -  Username: ${username} - Telegram ID: ${userId}`);

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
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  // Controllo che il file è presente nel messaggio inviato e che abbia un nome
  const file = ctx.document;
  if (!file) return;
  if (!file.fileName) {
    return await ctx.reply(format`${code(`❌ File must have a name.`)}`);
  }

  // Messaggio di stato iniziale
  const statusMessage = await ctx.reply(format`${bold(`[ ${FRAMES[0]} ] Download file`)}`);

  // Istanze per gestire le animazioni
  const downloadAnimation = new AnimationController();

  // Avvia animazione Download
  downloadAnimation.start(async (frame) => {
    await ctx.editMessageText(format`${bold(`[ ${frame} ] Download file`)}`, {
      chat_id: chatId,
      message_id: statusMessage.id,
    });
  });

  let finalPath: string | undefined;
  try {
    // Download del file dall' API locale di Telegram
    const downloadedFile = await bot.api.getFile({ file_id: file.fileId });

    // Costruisce il percorso finale e rinomina il file
    finalPath = await prepareFilePath(downloadedFile.file_path!, file.fileName, BOT_TOKEN);

    // Ferma l'animazione di download
    downloadAnimation.stop();

    // Upload del file (filebin.net)
    const url = await uploadFile(finalPath, file.fileName, userId, chatId, statusMessage.id, ctx);

    // Aggiorna messaggio di stato finale
    await ctx.editMessageText(format`${italic(underline(`🔗 Here's the link:`))}\n${url}`, {
      chat_id: chatId,
      message_id: statusMessage.id,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    // Ferma le animazioni in caso di errore
    downloadAnimation.stop();

    // Gestione dell'errore
    const errorMessage = errorHandler(error);
    await ctx.editMessageText(format`${code(errorMessage)}`, { chat_id: chatId, message_id: statusMessage.id });
  } finally {
    // Cleanup: elimina il file locale se esiste
    await cleanupFile(finalPath);
    // Assicuriamoci che siano fermate
    downloadAnimation.stop();
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
