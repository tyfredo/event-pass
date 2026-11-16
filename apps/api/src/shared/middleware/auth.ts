import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../errors.js';

export type UserRole = 'organizer' | 'attendee';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
    { id: 'org-a', name: 'Organizador A (Ana Gómez)', email: 'ana@eventos.com', role: 'organizer' },
  ],
  [
    'mock-organizer-b',
    { id: 'org-b', name: 'Organizador B (Carlos Ruiz)', email: 'carlos@eventos.com', role: 'organizer' },
  ],
  [
    'mock-attendee',
    { id: 'att-1', name: 'Asistente Demo (Laura Pérez)', email: 'laura@correo.com', role: 'attendee' },
  ],
]);

const base64UserSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
  role: z.enum(['organizer', 'attendee']),
});

/**
 * Los tokens mock y Base64 NO verifican nada: cualquiera puede fabricar uno con rol `organizer`.
 * Por eso solo se aceptan fuera de producción (o con ALLOW_MOCK_AUTH=true de forma explícita).
 * Se evalúa en cada petición para poder probarlo con `vi.stubEnv`.
 */
function isMockAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_AUTH === 'true';
}

function parseMockToken(token: string): AuthenticatedUser | null {
  const known = MOCK_USERS.get(token);
  if (known) return known;

  // Token Base64 JSON: btoa(JSON.stringify({ id, role, name?, email? }))
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8')) as unknown;
    const parsed = base64UserSchema.safeParse(decoded);
    if (!parsed.success) return null;

    const { id, name, email, role } = parsed.data;
    return { id, role, name: name ?? 'Usuario Autenticado', email: email ?? `${id}@demo.com` };
  } catch {
    return null;
  }
}

/**
 * Punto único de verificación de identidad.
 * En producción aquí va la verificación real (p. ej. `getAuth().verifyIdToken(token)` de
 * firebase-admin) devolviendo el usuario y su rol (custom claims).
 */
async function resolveUser(token: string): Promise<AuthenticatedUser | null> {
  if (isMockAuthEnabled()) {
    return parseMockToken(token);
  }
  return null; // TODO(producción): verificar token real
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  // El esquema de autorización no distingue mayúsculas (RFC 9110).
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '');
  if (!match?.[1]) {
    throw AppError.unauthorized('Header Authorization con formato Bearer <token> requerido.');
  }

  const user = await resolveUser(match[1]);
  if (!user) {
    throw AppError.unauthorized('El token proporcionado es inválido o ha expirado.');
  }

  req.user = user;
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw AppError.unauthorized();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}.`,
        'FORBIDDEN'
      );
    }

    next();
  };
}

/** Evita el `req.user!` en los controladores. */
export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) {
    throw AppError.unauthorized();
  }
  return req.user;
}
