import { PrismaClient } from '@prisma/client';
import { config, databaseUrl, testDatabaseUrl } from '../config/env.js';

const url = config.env === 'test' ? testDatabaseUrl : databaseUrl;

// La URL se pasa por constructor: DATABASE_URL no existe en el .env
// y la cadena compuesta jamás se loguea.
export const prisma = new PrismaClient({
  datasources: { db: { url } },
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});
