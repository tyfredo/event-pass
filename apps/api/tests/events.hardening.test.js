import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { eventsRepository } from '../src/modules/events/events.repository.js';
const ORG_A = 'Bearer mock-organizer-a';
const futureIso = (days = 10) => new Date(Date.now() + days * 86_400_000).toISOString();
const validBody = () => ({ title: 'Evento Válido', capacity: 20, startsAt: futureIso() });
afterEach(() => {
    vi.unstubAllEnvs();
});
describe('Autenticación (401)', () => {
    beforeEach(() => eventsRepository.seed());
    it('rechaza peticiones sin header Authorization', async () => {
        const res = await request(app).post('/api/events').send(validBody());
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
    it('rechaza tokens desconocidos y nombres de propiedades del prototipo', async () => {
        for (const token of ['token-falso', 'constructor', '__proto__']) {
            const res = await request(app).get('/api/events/mine').set('Authorization', `Bearer ${token}`);
            expect(res.status, token).toBe(401);
        }
    });
    it('acepta el esquema Bearer sin distinguir mayúsculas', async () => {
        const res = await request(app).get('/api/events/mine').set('Authorization', 'bearer mock-organizer-a');
        expect(res.status).toBe(200);
    });
    it('en producción NO acepta tokens mock ni tokens Base64 forjados', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        const forged = Buffer.from(JSON.stringify({ id: 'org-a', role: 'organizer' })).toString('base64');
        const mock = await request(app).get('/api/events/mine').set('Authorization', ORG_A);
        const b64 = await request(app).get('/api/events/mine').set('Authorization', `Bearer ${forged}`);
        expect(mock.status).toBe(401);
        expect(b64.status).toBe(401);
    });
    it('en desarrollo acepta un token Base64 válido y rechaza uno con rol inválido', async () => {
        const ok = Buffer.from(JSON.stringify({ id: 'org-x', role: 'organizer' })).toString('base64');
        const bad = Buffer.from(JSON.stringify({ id: 'org-x', role: 'admin' })).toString('base64');
        expect((await request(app).get('/api/events/mine').set('Authorization', `Bearer ${ok}`)).status).toBe(200);
        expect((await request(app).get('/api/events/mine').set('Authorization', `Bearer ${bad}`)).status).toBe(401);
    });
});
describe('Robustez del parser y validaciones extra', () => {
    beforeEach(() => eventsRepository.seed());
    it('JSON malformado responde 400 INVALID_JSON (antes era 500)', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', ORG_A)
            .set('Content-Type', 'application/json')
            .send('{"title": ');
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_JSON');
    });
    it('body demasiado grande responde 413', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', ORG_A)
            .send({ ...validBody(), description: 'x'.repeat(200_000) });
        expect(res.status).toBe(413);
        expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
    it('startsAt solo acepta ISO 8601 (no "December 25, 2030")', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', ORG_A)
            .send({ ...validBody(), startsAt: 'December 25, 2030' });
        expect(res.status).toBe(400);
    });
    it('rechaza aforos absurdos', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', ORG_A)
            .send({ ...validBody(), capacity: 1e12 });
        expect(res.status).toBe(400);
    });
    it('los mensajes de validación están en español e indican el origen (in)', async () => {
        const res = await request(app).post('/api/events').set('Authorization', ORG_A).send({});
        expect(res.status).toBe(400);
        const details = res.body.error.details;
        expect(details.find((d) => d.field === 'title')).toMatchObject({
            in: 'body',
            message: 'El título es obligatorio.',
        });
        expect(details.find((d) => d.field === 'capacity')?.message).toBe('El aforo (capacity) es obligatorio.');
    });
    it('valida el query param status', async () => {
        const res = await request(app).get('/api/events?status=borrado');
        expect(res.status).toBe(400);
        expect(res.body.error.details[0]).toMatchObject({ in: 'query', field: 'status' });
    });
    it('rechaza PATCH vacío y status inválido', async () => {
        const empty = await request(app).patch('/api/events/evt-101').set('Authorization', ORG_A).send({});
        expect(empty.status).toBe(400);
        const bad = await request(app)
            .patch('/api/events/evt-101/status')
            .set('Authorization', ORG_A)
            .send({ status: 'archivado' });
        expect(bad.status).toBe(400);
    });
    it('ignora campos que el cliente no debe controlar (organizerId, registeredCount)', async () => {
        const res = await request(app)
            .post('/api/events')
            .set('Authorization', ORG_A)
            .send({ ...validBody(), organizerId: 'org-b', registeredCount: 99 });
        expect(res.status).toBe(201);
        expect(res.body.data.organizerId).toBe('org-a');
        expect(res.body.data.registeredCount).toBe(0);
        const patch = await request(app)
            .patch(`/api/events/${res.body.data.id}`)
            .set('Authorization', ORG_A)
            .send({ title: 'Nuevo título', registeredCount: 5, organizerId: 'org-b' });
        expect(patch.status).toBe(200);
        expect(patch.body.data.registeredCount).toBe(0);
        expect(patch.body.data.organizerId).toBe('org-a');
    });
    it('permite capacity == registeredCount y calcula availableSeats = 0', async () => {
        const res = await request(app).patch('/api/events/evt-101').set('Authorization', ORG_A).send({ capacity: 35 });
        expect(res.status).toBe(200);
        expect(res.body.data.availableSeats).toBe(0);
    });
    it('ruta inexistente responde 404 con formato estándar', async () => {
        const res = await request(app).get('/api/nada');
        expect(res.status).toBe(404);
        expect(res.body.error.code).toBe('NOT_FOUND');
    });
});
