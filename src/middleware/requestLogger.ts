import morgan from 'morgan';
import logger from '../config/logger';

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan(
  (tokens, req, res) => {
    const userId = (req as any).user?.id ?? null;
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: `${tokens['response-time'](req, res)}ms`,
      userId,
    });
  },
  { stream }
);
