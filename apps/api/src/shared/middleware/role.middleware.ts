import type { NextFunction, Request, Response } from 'express'
import type { Role } from './auth.middleware.js'

export const requireRole = (...roles: Role[]) => {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      response.status(403).json({ message: 'Forbidden' })
      return
    }
    next()
  }
}
