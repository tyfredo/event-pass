import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
const mocks = vi.hoisted(() => ({
    createUser: vi.fn(),
    setCustomUserClaims: vi.fn(),
    verifyIdToken: vi.fn(),
    set: vi.fn(),
    get: vi.fn(),
}));
vi.mock('../src/config/firebase', () => ({
    auth: {
        createUser: mocks.createUser,
        setCustomUserClaims: mocks.setCustomUserClaims,
        verifyIdToken: mocks.verifyIdToken,
    },
    db: {
        collection: () => ({ doc: () => ({ set: mocks.set, get: mocks.get }) }),
    },
}));
import { authRouter } from '../src/modules/auth/auth.routes.js';
import { requireAuth, requireRole } from '../src/shared/middleware/auth.js';
import { AppError } from '../src/shared/errors.js';
function buildApp() {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.get('/api/organizer-only', requireAuth, requireRole('organizer'), (_req, res) => {
        res.json({ ok: true });
    });
    app.use((err, _req, res, _next) => {
        if (err instanceof AppError) {
            return res.status(err.status).json({ error: { code: err.code, message: err.message } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR' } });
    });
    return app;
}
const validBody = { name: 'Ana', email: 'ana@x.com', password: '123456', role: 'attendee' };
describe('auth', () => {
    const app = buildApp();
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ORGANIZER_CODE = 'secreto';
        mocks.createUser.mockResolvedValue({ uid: 'uid-1' });
    });
    it('registra un usuario correctamente', async () => {
        const res = await request(app).post('/api/auth/register').send(validBody);
        expect(res.status).toBe(201);
        expect(mocks.setCustomUserClaims).toHaveBeenCalledWith('uid-1', { role: 'attendee' });
        expect(mocks.set).toHaveBeenCalled();
    });
    it('rechaza organizador con código inválido (403)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ ...validBody, role: 'organizer', organizerCode: 'malo' });
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('INVALID_ORGANIZER_CODE');
        expect(mocks.createUser).not.toHaveBeenCalled();
    });
    it('rechaza email duplicado (409)', async () => {
        mocks.createUser.mockRejectedValue({ code: 'auth/email-already-exists' });
        const res = await request(app).post('/api/auth/register').send(validBody);
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('EMAIL_TAKEN');
    });
    it('GET /me sin token responde 401', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
    it('rol incorrecto responde 403', async () => {
        mocks.verifyIdToken.mockResolvedValue({ uid: 'u1', role: 'attendee' });
        const res = await request(app)
            .get('/api/organizer-only')
            .set('Authorization', 'Bearer token-falso');
        expect(res.status).toBe(403);
    });
});
