import NodeCache from 'node-cache';
import { config } from './index';

const cache = new NodeCache({
  stdTTL: config.cache.ttlSeconds,
  checkperiod: 120,
});

export default cache;
