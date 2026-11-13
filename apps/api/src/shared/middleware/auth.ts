import type { NextFunction, Request, Response } from 'express';
import { auth } from '../../config/firebase';
import { AppError } from '../errors';
import type { Role } from '../../types/express';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        throw new AppError(401, 'UNAUTHENTICATED', 'Token ausente');
    }
    try {
        const decoded = await auth.verifyIdToken(header.slice(7));
        req.user = { uid: decoded.uid, email: decoded.email, role: decoded.role as Role | undefined };
        next();
    } catch {
        throw new AppError(401, 'INVALID_TOKEN', 'Token inválido o expirado');
    }
}

export function requireRole(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            throw new AppError(403, 'FORBIDDEN', 'No tienes permiso para esta acción');
        }
        next();
    };
}