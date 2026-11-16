import express from 'express';
import cors from 'cors';
import { eventsRouter } from './modules/events/events.routes.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { AppError } from './shared/errors.js';

const app = express();

app.disable('x-powered-by');

// CORS_ORIGIN admite varios orígenes separados por coma. Por defecto, solo el front local de Nuxt.
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', module: 'events' });
});

app.use('/api/events', eventsRouter);

// Rutas no encontradas
app.use((req, _res, next) => {
  next(AppError.notFound(`La ruta ${req.method} ${req.originalUrl} no existe.`));
});

// Manejo centralizado de errores (siempre al final)
app.use(errorHandler);

export { app };
