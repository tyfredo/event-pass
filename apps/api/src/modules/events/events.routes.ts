import { Router } from 'express';
import { authenticate, requireRole } from '../../shared/middleware/auth.js';
import { validate } from '../../shared/middleware/validate.js';
import { eventsController } from './events.controller.js';
import {
  createEventSchema,
  eventIdParamSchema,
  listEventsQuerySchema,
  updateEventSchema,
  updateEventStatusSchema,
} from './events.schema.js';

const router = Router();

/** Autenticación + rol organizador, reutilizado en todas las rutas protegidas. */
const organizerOnly = [authenticate, requireRole('organizer')];

// Rutas públicas
router.get('/', validate({ query: listEventsQuerySchema }), eventsController.list);

// IMPORTANTE: `/mine` debe declararse antes de `/:id`
router.get('/mine', ...organizerOnly, eventsController.getMine);

router.get('/:id', validate({ params: eventIdParamSchema }), eventsController.getById);

// Creación y edición exclusivas para organizadores
router.post('/', ...organizerOnly, validate({ body: createEventSchema }), eventsController.create);

router.patch(
  '/:id',
  ...organizerOnly,
  validate({ params: eventIdParamSchema, body: updateEventSchema }),
  eventsController.update
);

router.patch(
  '/:id/status',
  ...organizerOnly,
  validate({ params: eventIdParamSchema, body: updateEventStatusSchema }),
  eventsController.updateStatus
);

export { router as eventsRouter };
