import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { auth } from '../../config/firebase.js';
import { AppError } from '../errors.js';

export type UserRole = 'organizer' | 'attendee';

export interface AuthenticatedUser {
  id: string;
  uid: string;
  name: string;
  email?: string;
  role?: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const MOCK_USERS = new Map<string, AuthenticatedUser>([
  [
    'mock-organizer-a',
    {
      id: 'org-a',
      uid: 'org-a',
      name: 'Organizador A (Ana Gómez)',
      email: 'ana@eventos.com',
      role: 'organizer',
    },
  ],
  [
    'mock-organizer-b',
    {
      id: 'org-b',
      uid: 'org-b',
      name: 'Organizador B (Carlos Ruiz)',
      email: 'carlos@eventos.com',
      role: 'organizer',
    },
  ],
  [
    'mock-attendee',
    {
      id: 'att-1',
      uid: 'att-1',
      name: 'Asistente Demo (Laura Pérez)',
      email: 'laura@correo.com',
      role: 'attendee',
    },
  ],
]);

const base64UserSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
  role: z.enum(['organizer', 'attendee']),
});

function isMockAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_AUTH === 'true';
}

function parseMockToken(token: string): AuthenticatedUser | null {
  const known = MOCK_USERS.get(token);
  if (known) return known;

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as unknown;
    const parsed = base64UserSchema.safeParse(decoded);
    if (!parsed.success) return null;

    const { id, name, email, role } = parsed.data;
    return {
      id,
      uid: id,
      role,
      name: name ?? 'Usuario Autenticado',
      email: email ?? `${id}@demo.com`,
    };
  } catch {
    return null;
  }
}

async function resolveUser(token: string): Promise<AuthenticatedUser> {
  if (isMockAuthEnabled()) {
    const mockUser = parseMockToken(token);
    if (mockUser) return mockUser;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    return {
      id: decoded.uid,
      uid: decoded.uid,
      name: (decoded.name as string | undefined) ?? decoded.email ?? 'Usuario',
      email: decoded.email,
      role: decoded.role as UserRole | undefined,
    };
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Token inválido o expirado.');
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '');
  if (!match?.[1]) {
    throw new AppError(401, 'UNAUTHORIZED', 'Header Authorization con formato Bearer <token> requerido.');
  }

  req.user = await resolveUser(match[1]);
  next();
}

// Alias para mantener compatibilidad con los módulos de develop (auth / registrations)
export const requireAuth = authenticate;

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Autenticación requerida.');
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}.`,
        'FORBIDDEN'
      );
    }

    next();
  };
}

export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  return req.user;
}