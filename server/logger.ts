import pino from "pino";
import { env } from "./config";

export const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV !== "production"
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        },
      }
    : {}),
});

export function createRequestLogger(reqId: string) {
  return logger.child({ reqId });
}
