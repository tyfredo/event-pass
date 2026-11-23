import type { Request, Response } from 'express'
import { createRegistrationSchema } from './registration.schema.js'
import { registrationService } from './registration.service.js'

const errorStatus: Record<string, number> = {
  EVENT_NOT_FOUND: 404,
  NOT_EVENT_OWNER: 403,
  EVENT_CLOSED: 409,
  EVENT_FULL: 409,
  ALREADY_REGISTERED: 409,
}

const handleError = (error: unknown, response: Response) => {
  if (error instanceof Error && errorStatus[error.message]) {
    response.status(errorStatus[error.message]!).json({ message: error.message })
    return true
  }
  return false
}

export const createRegistration = async (request: Request, response: Response) => {
  const input = createRegistrationSchema.parse(request.body)

  try {
    const data = await registrationService.create(input.eventId, request.user!.uid)
    response.status(201).json({ data })
  } catch (error) {
    if (!handleError(error, response)) throw error
  }
}

export const listMyRegistrations = async (request: Request, response: Response) => {
  const data = await registrationService.listMine(request.user!.uid)
  response.json({ data })
}

export const listEventRegistrations = async (request: Request<{ id: string }>, response: Response) => {
  try {
    const data = await registrationService.listByEvent(request.params.id, request.user!.uid)
    response.json({ data })
  } catch (error) {
    if (!handleError(error, response)) throw error
  }
}

export const getPass = async (request: Request<{ id: string }>, response: Response) => {
  const data = await registrationService.getPass(request.params.id, request.auth!.sub)
  response.json({ data })
}
