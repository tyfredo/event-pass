import type { Request, Response } from 'express';
import { requireUser } from '../../shared/middleware/auth.js';
import { eventsService } from './events.service.js';
import type {
  CreateEventInput,
  EventStatus,
  UpdateEventInput,
  UpdateEventStatusInput,
} from './events.schema.js';

// `req.params.id` ya fue validado/normalizado por `validate({ params })`.
// En Express 5 los params se tipan como `string | string[]`, de ahí el `String(...)`.
const idOf = (req: Request): string => String(req.params.id);

export class EventsController {
  public create = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const event = await eventsService.createEvent(user.id, req.body as CreateEventInput);
    res.status(201).json({ data: event });
  };

  public list = async (req: Request, res: Response): Promise<void> => {
    const status = req.query.status as EventStatus | undefined;
    const events = await eventsService.listEvents(status);
    res.status(200).json({ data: events });
  };

  public getMine = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const events = await eventsService.listOrganizerEvents(user.id);
    res.status(200).json({ data: events });
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    const event = await eventsService.getEventById(idOf(req));
    res.status(200).json({ data: event });
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const updated = await eventsService.updateEvent(idOf(req), user.id, req.body as UpdateEventInput);
    res.status(200).json({ data: updated });
  };

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    const user = requireUser(req);
    const { status } = req.body as UpdateEventStatusInput;
    const updated = await eventsService.updateEventStatus(idOf(req), user.id, status);
    res.status(200).json({ data: updated });
  };
}

export const eventsController = new EventsController();
