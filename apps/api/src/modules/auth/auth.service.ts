import { auth, db } from '../../config/firebase'
import { AppError } from '../../shared/errors'
import type { RegisterInput } from './auth.schema.ts'


export async function registerUser(input: RegisterInput) {
    const { name, email, password, role, origanizerCode } = input;

    if (role === 'organizer') {
        const expected = process.env.ORGANIZER_CODE;
        if (!expected || origanizerCode !== expected) {
            throw new AppError(403, 'INVALID_ORGANIZER_CODE', 'Código de organizador inválido');
        }
    }

    let uid: string;
    try {
        const user = await auth.createUser({ email, password, displayName: name });
        uid = user.uid;
    } catch (err: any) {
        if (err?.code === 'auth/email-already-exists') {
            throw new AppError(409, 'EMAIL_TAKEN', 'Ese correo ya está registrado');
        }
        throw err;
    }

    await auth.setCustomUserClaims(uid, { role });

    const profile = { uid, name, email, role, createAt: new Date().toISOString() };
    await db.collection('users').doc(uid).set(profile);

    return profile
}

export async function getProfile(uid: string) {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists)
        throw new AppError(404, 'USER_NOT_FOUND', 'Perfil no encontrado')
    return snap.data()
}