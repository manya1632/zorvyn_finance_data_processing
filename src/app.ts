import express, { Application } from 'express';
import cors from "cors";
import helmet from 'helmet';
import { config } from './config';

export function createApp() : Application{
    const app  = express();
    app.use(helmet());
    app.use(cors({
        origin: config.cors.allowedOrigins.includes('*') ? '*' : config.cors.allowedOrigins,
        credentials: true,
    }));

    app.use(express.json({ limit: '10kb' }));
    app.use(express.urlencoded({ extended: true, limit: '10kb' }));

    return app;
}