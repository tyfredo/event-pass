import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { memoryEventsRepository as eventsRepository } from '../src/modules/events/events.repository.js';

const ORG_A_TOKEN = 'Bearer mock-organizer-a';
const ORG_B_TOKEN = 'Bearer mock-organizer-b';
const ATTENDEE_TOKEN = 'Bearer mock-attendee';

const futureIsoDate = (daysAhead = 10): string =>
  new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

const pastIsoDate = (daysAgo = 5): string =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

describe('Módulo de Eventos - API REST (/api/events)', () => {
  beforeEach(() => {
    eventsRepository.clear();
  });

  describe('1. Validaciones de entrada (400 Bad Request)', () => {
    it('rechaza creación con capacity <= 0', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Evento Inválido',
          description: 'Aforo cero',
          capacity: 0,
          startsAt: futureIsoDate(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza creación con capacity no entero', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Evento Decimal',
          capacity: 15.5,
          startsAt: futureIsoDate(),
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza creación con startsAt en el pasado o formato inválido', async () => {
      const resPast = await request(app)
        .post('/api/events')
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Evento Pasado',
          capacity: 50,
          startsAt: pastIsoDate(),
        });

      expect(resPast.status).toBe(400);
      expect(resPast.body.error.code).toBe('VALIDATION_ERROR');

      const resInvalid = await request(app)
        .post('/api/events')
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Fecha Corrupta',
          capacity: 50,
          startsAt: 'no-es-una-fecha',
        });

      expect(resInvalid.status).toBe(400);
      expect(resInvalid.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rechaza edición cuando capacity < registeredCount con INVALID_CAPACITY', async () => {
      const created = await eventsRepository.create({
        organizerId: 'org-a',
        title: 'Evento con Inscritos',
        description: 'Prueba aforo',
        location: 'Sala 1',
        capacity: 50,
        registeredCount: 25,
        status: 'open',
        startsAt: futureIsoDate(),
      });

      const res = await request(app)
        .patch(`/api/events/${created.id}`)
        .set('Authorization', ORG_A_TOKEN)
        .send({ capacity: 20 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_CAPACITY');
    });
  });

  describe('2. Autorización por rol - Asistente bloqueado (403 FORBIDDEN)', () => {
    it('impide a un asistente crear, consultar /mine o editar eventos', async () => {
      const event = await eventsRepository.create({
        organizerId: 'org-a',
        title: 'Evento Protegido',
        description: 'Solo organizadores',
        location: 'Auditorio',
        capacity: 40,
        registeredCount: 0,
        status: 'open',
        startsAt: futureIsoDate(),
      });

      const postRes = await request(app)
        .post('/api/events')
        .set('Authorization', ATTENDEE_TOKEN)
        .send({
          title: 'Intento Asistente',
          capacity: 20,
          startsAt: futureIsoDate(),
        });
      expect(postRes.status).toBe(403);
      expect(postRes.body.error.code).toBe('FORBIDDEN');

      const mineRes = await request(app)
        .get('/api/events/mine')
        .set('Authorization', ATTENDEE_TOKEN);
      expect(mineRes.status).toBe(403);
      expect(mineRes.body.error.code).toBe('FORBIDDEN');

      const patchRes = await request(app)
        .patch(`/api/events/${event.id}`)
        .set('Authorization', ATTENDEE_TOKEN)
        .send({ title: 'Hackeado' });
      expect(patchRes.status).toBe(403);
      expect(patchRes.body.error.code).toBe('FORBIDDEN');

      const statusRes = await request(app)
        .patch(`/api/events/${event.id}/status`)
        .set('Authorization', ATTENDEE_TOKEN)
        .send({ status: 'closed' });
      expect(statusRes.status).toBe(403);
      expect(statusRes.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Autorización por propiedad - No es dueño (403 NOT_EVENT_OWNER)', () => {
    it('impide que Organizador B edite o cambie estado de un evento de Organizador A', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Evento Exclusivo de A',
          description: 'Propiedad de Organizador A',
          capacity: 80,
          startsAt: futureIsoDate(),
        });

      const eventId = createRes.body.data.id;

      const editByB = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', ORG_B_TOKEN)
        .send({ title: 'Modificado por B' });

      expect(editByB.status).toBe(403);
      expect(editByB.body.error.code).toBe('NOT_EVENT_OWNER');

      const closeByB = await request(app)
        .patch(`/api/events/${eventId}/status`)
        .set('Authorization', ORG_B_TOKEN)
        .send({ status: 'closed' });

      expect(closeByB.status).toBe(403);
      expect(closeByB.body.error.code).toBe('NOT_EVENT_OWNER');
    });
  });

  describe('4. Recursos inexistentes (404 NOT_FOUND)', () => {
    it('retorna 404 al consultar o actualizar un ID inexistente', async () => {
      const getRes = await request(app).get('/api/events/evt-no-existe');
      expect(getRes.status).toBe(404);
      expect(getRes.body.error.code).toBe('NOT_FOUND');

      const patchRes = await request(app)
        .patch('/api/events/evt-no-existe')
        .set('Authorization', ORG_A_TOKEN)
        .send({ title: 'Nuevo título' });
      expect(patchRes.status).toBe(404);
      expect(patchRes.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('5. Flujo completo (Happy Path)', () => {
    it('permite crear, listar públicamente, filtrar por estado, consultar /mine, editar y cerrar/abrir', async () => {
      // 1. Organizador A crea evento
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Hackathon Universitario 2026',
          description: '48 horas de desarrollo colaborativo.',
          location: 'Centro de Convenciones',
          capacity: 120,
          startsAt: futureIsoDate(15),
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.data).toMatchObject({
        organizerId: 'org-a',
        title: 'Hackathon Universitario 2026',
        capacity: 120,
        registeredCount: 0,
        availableSeats: 120,
        status: 'open',
      });

      const eventId = createRes.body.data.id;

      // 2. Consulta pública general y filtrada
      const publicList = await request(app).get('/api/events?status=open');
      expect(publicList.status).toBe(200);
      expect(publicList.body.data).toHaveLength(1);
      expect(publicList.body.data[0].availableSeats).toBe(120);

      // 3. Detalle público
      const detailRes = await request(app).get(`/api/events/${eventId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.id).toBe(eventId);

      // 4. Consulta /mine para Organizador A vs Organizador B
      const mineA = await request(app)
        .get('/api/events/mine')
        .set('Authorization', ORG_A_TOKEN);
      expect(mineA.status).toBe(200);
      expect(mineA.body.data).toHaveLength(1);

      const mineB = await request(app)
        .get('/api/events/mine')
        .set('Authorization', ORG_B_TOKEN);
      expect(mineB.status).toBe(200);
      expect(mineB.body.data).toHaveLength(0);

      // 5. Edición de datos por Organizador A
      const updateRes = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', ORG_A_TOKEN)
        .send({
          title: 'Hackathon Universitario 2026 - Edición Final',
          capacity: 150,
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.title).toBe('Hackathon Universitario 2026 - Edición Final');
      expect(updateRes.body.data.availableSeats).toBe(150);

      // 6. Cierre del evento
      const closeRes = await request(app)
        .patch(`/api/events/${eventId}/status`)
        .set('Authorization', ORG_A_TOKEN)
        .send({ status: 'closed' });
      expect(closeRes.status).toBe(200);
      expect(closeRes.body.data.status).toBe('closed');

      // Ya no aparece en ?status=open
      const openOnly = await request(app).get('/api/events?status=open');
      expect(openOnly.body.data).toHaveLength(0);
    });
  });
});
