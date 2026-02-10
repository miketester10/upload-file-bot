import pino from "pino";

const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      translateTime: "SYS:dd-mm-yyyy HH:MM:ss", // usa SYS: per forzare il locale
      colorize: true,
      ignore: "pid,hostname",
    },
  },
  level: "debug",
});

export { logger };
