import type { NextFunction, Request, Response } from 'express'
import { auth } from '../../config/firebase.js'

export type Role = 'attendee' | 'organizer'

declare global {
  namespace Express {
    interface Request {
      auth?: {
        sub: string
        email: string
        role: Role
      }
    }
  }
}

export const requireAuth = async (
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  const header = request.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    response.status(401).json({ message: 'Unauthorized' })
    return
  }

  try {
    const decoded = await auth.verifyIdToken(header.substring(7))
    request.auth = { sub: decoded.uid, email: decoded.email ?? '', role: decoded.role }
    next()
  } catch {
    response.status(401).json({ message: 'Invalid or expired token' })
  }
}
