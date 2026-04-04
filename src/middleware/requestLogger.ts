import morgan from 'morgan';
import { Request, Response } from 'express';
import logger from '../config/logger';

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export const requestLogger = morgan(
  (tokens, req: Request, res: Response) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: `${tokens['response-time'](req, res)}ms`,
      userId: req.user?.id ?? null,
    });
  },
  { stream }
);
