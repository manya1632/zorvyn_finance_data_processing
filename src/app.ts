import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { sendSuccess } from './utils/response';
import { setupSwagger } from './config/swagger';
import { requestLogger } from '@middleware/requestLogger';
import { globalRateLimiter } from '@middleware/rateLimiter';
import { errorHandler } from '@middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  app.use(helmet());

  app.use(cors({
    origin: config.cors.allowedOrigins.includes('*') ? '*' : config.cors.allowedOrigins,
    credentials: true,
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  app.use(requestLogger);
  app.use('/api/', globalRateLimiter);


  app.get('/api/v1/health', (_req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  setupSwagger(app);
  app.use(errorHandler);
  return app;
}
