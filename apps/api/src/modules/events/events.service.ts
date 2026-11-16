import { AppError } from '../../shared/errors.js';
import { eventsRepository, type EventsRepository } from './events.repository.js';
import type {
  CreateEventInput,
  EventDTO,
  EventEntity,
  EventStatus,
  UpdateEventInput,
} from './events.schema.js';

export class EventsService {
  constructor(private readonly repository: EventsRepository) {}

  private toDTO(entity: EventEntity): EventDTO {
    return {
      ...entity,
      // Regla de negocio: availableSeats = capacity - registeredCount (nunca negativo).
      availableSeats: Math.max(0, entity.capacity - entity.registeredCount),
    };
  }

  private notFound(id: string): AppError {
    return AppError.notFound(`No se encontró ningún evento con el ID '${id}'.`);
  }

  /** Carga el evento y garantiza que `organizerId` es su dueño (404 → 403 NOT_EVENT_OWNER). */
  private async getOwnedEvent(
    id: string,
    organizerId: string,
    forbiddenMessage: string
  ): Promise<EventEntity> {
    const event = await this.repository.findById(id);
    if (!event) throw this.notFound(id);

    if (event.organizerId !== organizerId) {
      throw AppError.forbidden(forbiddenMessage, 'NOT_EVENT_OWNER');
    }
    return event;
  }

  public async createEvent(organizerId: string, input: CreateEventInput): Promise<EventDTO> {
    const created = await this.repository.create({
      organizerId,
      title: input.title,
      description: input.description,
      location: input.location,
      capacity: input.capacity,
      registeredCount: 0,
      status: 'open',
      startsAt: input.startsAt,
    });

    return this.toDTO(created);
  }

  public async listEvents(status?: EventStatus): Promise<EventDTO[]> {
    const events = await this.repository.findAll(status ? { status } : undefined);
    return events.map((evt) => this.toDTO(evt));
  }

  public async getEventById(id: string): Promise<EventDTO> {
    const event = await this.repository.findById(id);
    if (!event) throw this.notFound(id);
    return this.toDTO(event);
  }

  public async listOrganizerEvents(organizerId: string): Promise<EventDTO[]> {
    const events = await this.repository.findByOrganizerId(organizerId);
    return events.map((evt) => this.toDTO(evt));
  }

  public async updateEvent(
    id: string,
    organizerId: string,
    input: UpdateEventInput
  ): Promise<EventDTO> {
    const existing = await this.getOwnedEvent(
      id,
      organizerId,
      'No puedes modificar un evento que pertenece a otro organizador.'
    );

    if (input.capacity !== undefined && input.capacity < existing.registeredCount) {
      throw AppError.badRequest(
        `El nuevo aforo (${input.capacity}) no puede ser menor al número de asistentes ya registrados (${existing.registeredCount}).`,
        'INVALID_CAPACITY'
      );
    }

    const updated = await this.repository.update(id, input);
    if (!updated) throw this.notFound(id);
    return this.toDTO(updated);
  }

  public async updateEventStatus(
    id: string,
    organizerId: string,
    status: EventStatus
  ): Promise<EventDTO> {
    await this.getOwnedEvent(
      id,
      organizerId,
      'No puedes cambiar el estado de un evento que pertenece a otro organizador.'
    );

    const updated = await this.repository.update(id, { status });
    if (!updated) throw this.notFound(id);
    return this.toDTO(updated);
  }
}

export const eventsService = new EventsService(eventsRepository);
