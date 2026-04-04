import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/requestLogger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';
import { setupSwagger } from './config/swagger';
import usersRouter from './modules/users/users.routes';
import authRouter from './modules/auth/auth.routes';
import recordsRouter from './modules/records/records.routes';
import dashboardRouter from './modules/dashboard/dashboard.routes';


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

  app.use('/api/v1/auth', authRouter); //auth routes
  app.use('/api/v1/users', usersRouter); // user routes
  app.use('/api/v1/records', recordsRouter); // record routes
  app.use('/api/v1/dashboard', dashboardRouter); // dashboard routes

  setupSwagger(app);
  app.use(errorHandler);
  return app;
}
