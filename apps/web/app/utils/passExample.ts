import type { Pass } from '~/types/pass'

// Coincide con el evento "evt-abierto" que crea `apps/api/src/scripts/seed.ts`,
// para que al escanear el QR la página encuentre el evento en la API.
export const examplePass: Pass = {
  id: 'evt-abierto_ana',
  folio: 'EVT-SEED01',
  status: 'active',
  eventId: 'evt-abierto',
  eventTitle: 'Congreso de Cómputo en la Nube',
  eventStartsAt: '2026-12-05T17:00:00.000Z',
  eventLocation: 'Auditorio A',
  attendeeName: 'Ana Asistente',
}

export const cancelledExamplePass: Pass = { ...examplePass, status: 'cancelled' }