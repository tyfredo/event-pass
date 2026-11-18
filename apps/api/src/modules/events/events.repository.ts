import { randomUUID } from 'node:crypto';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { db } from '../../config/firebase.js';
import type { EventEntity, EventStatus } from './events.schema.js';

export type NewEventData = Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type EventPatch = Partial<Omit<EventEntity, 'id' | 'organizerId' | 'createdAt'>>;

/**
 * Contrato de persistencia. El servicio depende SOLO de esta interfaz, así que cambiar a
 * Firestore es crear `FirestoreEventsRepository implements EventsRepository` sin tocar el servicio.
 */
export interface EventsRepository {
  create(data: NewEventData): Promise<EventEntity>;
  findAll(filter?: { status?: EventStatus }): Promise<EventEntity[]>;
  findById(id: string): Promise<EventEntity | null>;
  findByOrganizerId(organizerId: string): Promise<EventEntity[]>;
  update(id: string, data: EventPatch): Promise<EventEntity | null>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class InMemoryEventsRepository implements EventsRepository {
  private events = new Map<string, EventEntity>();

  constructor(seedInitialData = true) {
    if (seedInitialData) {
      this.seed();
    }
  }

  public seed(): void {
    this.events.clear();
    const now = new Date();
    const at = (days: number) => new Date(now.getTime() + days * DAY_MS).toISOString();
    const stamp = now.toISOString();

    const initialEvents: EventEntity[] = [
      {
        id: 'evt-101',
        organizerId: 'org-a',
        title: 'Conferencia Fullstack & Nuxt 4',
        description: 'Aprende arquitectura moderna con Express 5, TypeScript, Nuxt 4 y Pinia.',
        location: 'Auditorio Principal - Campus Central',
        capacity: 100,
        registeredCount: 35,
        status: 'open',
        startsAt: at(7),
        createdAt: stamp,
        updatedAt: stamp,
      },
      {
        id: 'evt-102',
        organizerId: 'org-a',
        title: 'Taller Práctico de Testing con Vitest',
        description: 'Pruebas unitarias y de integración con Supertest en APIs REST.',
        location: 'Laboratorio 3B',
        capacity: 30,
        registeredCount: 30,
        status: 'closed',
        startsAt: at(14),
        createdAt: stamp,
        updatedAt: stamp,
      },
      {
        id: 'evt-103',
        organizerId: 'org-b',
        title: 'Meetup Cloud & Arquitectura Serverless',
        description: 'Despliegue escalable en Firestore y contenedores ligeros.',
        location: 'Sala de Innovación Norte',
        capacity: 60,
        registeredCount: 12,
        status: 'open',
        startsAt: at(30),
        createdAt: stamp,
        updatedAt: stamp,
      },
    ];

    for (const evt of initialEvents) {
      this.events.set(evt.id, evt);
    }
  }

  /** Solo para pruebas. */
  public clear(): void {
    this.events.clear();
  }

  public async create(data: NewEventData): Promise<EventEntity> {
    const now = new Date().toISOString();
    const newEvent: EventEntity = {
      ...data,
      id: `evt-${randomUUID()}`, // UUID completo: el recorte a 8 caracteres podía colisionar
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(newEvent.id, newEvent);
    return { ...newEvent };
  }

  public async findAll(filter?: { status?: EventStatus }): Promise<EventEntity[]> {
    const all = Array.from(this.events.values());
    const filtered = filter?.status ? all.filter((e) => e.status === filter.status) : all;

    return filtered
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
      .map((e) => ({ ...e }));
  }

  public async findById(id: string): Promise<EventEntity | null> {
    const found = this.events.get(id);
    return found ? { ...found } : null;
  }

  public async findByOrganizerId(organizerId: string): Promise<EventEntity[]> {
    return Array.from(this.events.values())
      .filter((e) => e.organizerId === organizerId)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((e) => ({ ...e }));
  }

  public async update(id: string, data: EventPatch): Promise<EventEntity | null> {
    const existing = this.events.get(id);
    if (!existing) return null;

    const updated: EventEntity = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.events.set(id, updated);
    return { ...updated };
  }
}

export class FirestoreEventsRepository implements EventsRepository {
  private collection = db.collection('events');

  private toEntity(doc: DocumentSnapshot): EventEntity {
    return { id: doc.id, ...doc.data() } as EventEntity;
  }

  public async create(data: NewEventData): Promise<EventEntity> {
    const now = new Date().toISOString();
    const ref = this.collection.doc();
    const newEvent = { ...data, createdAt: now, updatedAt: now };
    await ref.set(newEvent);
    return { id: ref.id, ...newEvent };
  }

  public async findAll(filter?: { status?: EventStatus }): Promise<EventEntity[]> {
    const query = filter?.status ? this.collection.where('status', '==', filter.status) : this.collection;
    const snap = await query.get();
    return snap.docs
      .map((doc) => this.toEntity(doc))
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }

  public async findById(id: string): Promise<EventEntity | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? this.toEntity(doc) : null;
  }

  public async findByOrganizerId(organizerId: string): Promise<EventEntity[]> {
    const snap = await this.collection.where('organizerId', '==', organizerId).get();
    return snap.docs
      .map((doc) => this.toEntity(doc))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  public async update(id: string, data: EventPatch): Promise<EventEntity | null> {
    const ref = this.collection.doc(id);
    if (!(await ref.get()).exists) return null;

    const changes = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
    await ref.update({ ...changes, updatedAt: new Date().toISOString() });
    return this.toEntity(await ref.get());
  }
}

// Las pruebas usan memoria para no escribir en Firestore.
export const memoryEventsRepository = new InMemoryEventsRepository(true);
export const eventsRepository: EventsRepository = process.env.VITEST
  ? memoryEventsRepository
  : new FirestoreEventsRepository();
