import { describe, expect, it } from 'vitest';
import { checkCanRegister, generateFolio } from '../src/modules/registrations/registration.rules.js';
const openEvent = { status: 'open', capacity: 2, registeredCount: 0 };
describe('Reglas de inscripción', () => {
    it('permite inscribirse a un evento abierto con lugares', () => {
        expect(() => checkCanRegister(openEvent, false)).not.toThrow();
    });
    it('rechaza un evento que no existe', () => {
        expect(() => checkCanRegister(null, false)).toThrow('EVENT_NOT_FOUND');
    });
    it('rechaza un evento cerrado', () => {
        expect(() => checkCanRegister({ ...openEvent, status: 'closed' }, false)).toThrow('EVENT_CLOSED');
    });
    it('rechaza una inscripción duplicada', () => {
        expect(() => checkCanRegister(openEvent, true)).toThrow('ALREADY_REGISTERED');
    });
    it('rechaza un evento lleno', () => {
        expect(() => checkCanRegister({ ...openEvent, registeredCount: 2 }, false)).toThrow('EVENT_FULL');
    });
    it('genera folios con formato EVP-AAAA-XXXXXX', () => {
        expect(generateFolio()).toMatch(/^EVP-\d{4}-[0-9A-F]{6}$/);
    });
});
