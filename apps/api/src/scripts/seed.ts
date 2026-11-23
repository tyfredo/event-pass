import 'dotenv/config'
import { auth, db } from '../config/firebase.js'


const PASSWORD = 'Password123'
const now = new Date().toISOString()
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString()

const users = [
    { name: 'Olivia Organizadora', email: 'org1@eventpass.test', role: 'organizer' },
    { name: 'Oscar Organizador', email: 'org2@eventpass.test', role: 'organizer' },
    { name: 'Ana Asistente', email: 'ana@eventpass.test', role: 'attendee' },
    { name: 'Beto Asistente', email: 'beto@eventpass.test', role: 'attendee' },
    { name: 'Carla Asistente', email: 'carla@eventpass.test', role: 'attendee' },
] as const

async function upsertUser(u: (typeof users)[number]): Promise<string> {
    let uid: string
    try {
        uid = (await auth.getUserByEmail(u.email)).uid
    } catch {
        uid = (await auth.createUser({ email: u.email, password: PASSWORD, displayName: u.name })).uid
    }
    await auth.setCustomUserClaims(uid, { role: u.role })
    await db
        .collection('users')
        .doc(uid)
        .set({ uid, name: u.name, email: u.email, role: u.role, createdAt: now }, { merge: true })
    return uid
}

async function main() {
    const uids: Record<string, string> = {}
    for (const u of users) uids[u.email] = await upsertUser(u)

    // Limpieza del formato anterior
    await db.recursiveDelete(db.collection('registrationIndex'))
    await db.collection('registrations').doc('EVT-SEED01').delete()
    await db.collection('registrations').doc('EVT-SEED02').delete()

    const org1 = uids['org1@eventpass.test']!
    const events = [
        { id: 'evt-abierto', title: 'Congreso de Cómputo en la Nube', description: 'Charlas y talleres.', startsAt: inDays(14), location: 'Auditorio A', capacity: 100, registeredCount: 0, status: 'open' },
        { id: 'evt-casi-lleno', title: 'Taller de Docker', description: 'Cupo muy limitado.', startsAt: inDays(7), location: 'Laboratorio 3', capacity: 3, registeredCount: 2, status: 'open' },
        { id: 'evt-cerrado', title: 'Hackathon pasado', description: 'Inscripciones cerradas.', startsAt: inDays(-10), location: 'Gimnasio', capacity: 50, registeredCount: 0, status: 'closed' },
    ]
    for (const { id, ...e } of events) {
        await db.collection('events').doc(id).set({ ...e, organizerId: org1, createdAt: now, updatedAt: now })
    }

    const eventId = 'evt-casi-lleno'
    const regs = [
        { folio: 'EVP-2026-SEED01', email: 'ana@eventpass.test', name: 'Ana Asistente' },
        { folio: 'EVP-2026-SEED02', email: 'beto@eventpass.test', name: 'Beto Asistente' },
    ]
    for (const r of regs) {
        const uid = uids[r.email]!
        const id = `${eventId}_${uid}`
        await db.collection('registrations').doc(id).set({
            eventId,
            attendeeId: uid,
            attendeeName: r.name,
            attendeeEmail: r.email,
            eventTitle: 'Taller de Docker',
            folio: r.folio,
            status: 'active',
            createdAt: now,
        })
        console.log(`Pase de ${r.name}: GET /api/registrations/${id}`)
    }

    console.log('Seed listo. Contraseña de todos:', PASSWORD)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })