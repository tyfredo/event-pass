import 'dotenv/config';
import { auth, db } from '../config/firebase';

const DEV_PROJECT = 'event-pass-511ff';
if (process.env.FIREBASE_PROJECT_ID !== DEV_PROJECT) {
    console.error(`Seed bloqueado: FIREBASE_PROJECT_ID es "${process.env.FIREBASE_PROJECT_ID}", solo se permite "${DEV_PROJECT}".`);
    process.exit(1);
}

const PASSWORD = 'Password123';
const now = new Date().toISOString();
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

const users = [
    { name: 'Olivia Organizadora', email: 'org1@eventpass.test', role: 'organizer' },
    { name: 'Oscar Organizador', email: 'org2@eventpass.test', role: 'organizer' },
    { name: 'Ana Asistente', email: 'ana@eventpass.test', role: 'attendee' },
    { name: 'Beto Asistente', email: 'beto@eventpass.test', role: 'attendee' },
    { name: 'Carla Asistente', email: 'carla@eventpass.test', role: 'attendee' },
] as const;

async function upsertUser(u: (typeof users)[number]) {
    let uid: string;
    try {
        uid = (await auth.getUserByEmail(u.email)).uid;
    } catch {
        uid = (await auth.createUser({ email: u.email, password: PASSWORD, displayName: u.name })).uid;
    }
    await auth.setCustomUserClaims(uid, { role: u.role });
    await db.collection('users').doc(uid).set(
        { uid, name: u.name, email: u.email, role: u.role, createdAt: now },
        { merge: true },
    );
    return uid;
}

async function main() {
    for (const u of users) await upsertUser(u);

    const events = [
        { id: 'evt-abierto', title: 'Congreso de Cómputo en la Nube', description: 'Charlas y talleres.', date: inDays(14), location: 'Auditorio A', capacity: 100, registeredCount: 2, status: 'open' },
        { id: 'evt-casi-lleno', title: 'Taller de Docker', description: 'Cupo muy limitado.', date: inDays(7), location: 'Laboratorio 3', capacity: 3, registeredCount: 2, status: 'open' },
        { id: 'evt-cerrado', title: 'Hackathon pasado', description: 'Inscripciones cerradas.', date: inDays(-10), location: 'Gimnasio', capacity: 50, registeredCount: 0, status: 'closed' },
    ];
    for (const { id, ...e } of events) {
        await db.collection('events').doc(id).set({ ...e, createdAt: now });
    }

    const regs = [
        { folio: 'EVT-SEED01', eventId: 'evt-abierto', name: 'Ana Asistente', email: 'ana@eventpass.test' },
        { folio: 'EVT-SEED02', eventId: 'evt-abierto', name: 'Beto Asistente', email: 'beto@eventpass.test' },
    ];
    for (const r of regs) {
        await db.collection('registrations').doc(r.folio).set({
            eventId: r.eventId,
            attendee: { name: r.name, email: r.email },
            status: 'registered',
            createdAt: now,
        });
        await db.collection('registrationIndex').doc(`${r.eventId}_${r.email}`).set({ folio: r.folio, createdAt: now });
    }

    console.log('Seed listo. Contraseña de todos los usuarios:', PASSWORD);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });