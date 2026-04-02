import { blockquote, bold, Bot, code, format, italic, underline } from "gramio";
import { FRAMES, AnimationController, downloadFile, uploadFile, cleanupFile } from "./utility";
import { handleError } from "./error";
import { logger } from "./logger";
import { ErrorOperation } from "./types";
import { config } from "dotenv";
import prettyBytes from "pretty-bytes";
config({ quiet: true });

const BOT_TOKEN = process.env.BOT_TOKEN!;
const LOCAL_BOT_API = process.env.LOCAL_BOT_API!;
const BOT_OWNER_TELEGRAM_ID = parseInt(process.env.BOT_OWNER_TELEGRAM_ID!);
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_BYTES!);

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
  const isBotOwner = userId === BOT_OWNER_TELEGRAM_ID;

  // Controllo che il file è presente nel messaggio inviato e che abbia un nome ed una dimensione valida
  const file = ctx.document;
  const fileName = file?.fileName;
  const fileSize = file?.fileSize;
  if (!file) return;
  if (!fileName || !fileSize) {
    return await ctx.reply(format`${code(`❌ File must have a name and a valid size.`)}`);
  }
  if (!isBotOwner && fileSize > MAX_FILE_SIZE_BYTES) {
    logger.warn(`File rejected: ${fileName} | Size: ${prettyBytes(fileSize)}`);
    return await ctx.reply(format`${code(`❌ Files cannot be larger than ${prettyBytes(MAX_FILE_SIZE_BYTES)}.`)}`);
  }

  // Messaggio di stato iniziale
  const statusMessage = await ctx.reply(format`${bold(`[ ${FRAMES[0]} ] Download file`)}`);

  // Istanza per gestire animazione durante il download
  const downloadAnimation = new AnimationController();
  downloadAnimation.start(async (frame) => {
    await ctx.editMessageText(format`${bold(`[ ${frame} ] Download file`)}`, {
      chat_id: chatId,
      message_id: statusMessage.id,
    });
  });

  let filePath: string | undefined;
  try {
    // Download del file dall'API di Telegram
    filePath = await downloadFile(file.fileId, fileName);

    // Ferma l'animazione di download
    downloadAnimation.stop();

    // Upload del file su filebin.net
    const url = await uploadFile(filePath, fileName, userId, chatId, statusMessage.id, ctx);

    // Aggiorna messaggio di stato finale
    await ctx.editMessageText(format`${italic(underline(`🔗 Here's the link:`))}\n${url}`, {
      chat_id: chatId,
      message_id: statusMessage.id,
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    // Ferma l'animazione in caso di errore
    downloadAnimation.stop();
    // Gestione dell'errore
    const userErrorMessage = handleError(error, {
      op: ErrorOperation.MESSAGE_HANDLER,
      userId,
      chatId,
      fileName,
    });
    await ctx.editMessageText(format`${code(userErrorMessage)}`, { chat_id: chatId, message_id: statusMessage.id });
  } finally {
    // Cleanup: elimina il file dalla cartella tmp dopo l'upload (o in caso di errore), se esiste
    await cleanupFile(filePath);
  }
});

// Avvia il bot
(async () => {
  try {
    await bot.start();
    logger.info("✅ Bot avviato con successo");
  } catch (error) {
    handleError(error, { op: ErrorOperation.BOT_START });
  }
})();
