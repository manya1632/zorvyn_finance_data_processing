import winston from 'winston';
import { config } from './index';

const { combine, timestamp, json } = winston.format;

const level =
  config.nodeEnv === 'production' && config.log.level === 'debug' ? 'info' : config.log.level;

const logger = winston.createLogger({
  level,
  format: combine(timestamp(), json()),
  transports: [new winston.transports.Console()],
});

export default logger;
