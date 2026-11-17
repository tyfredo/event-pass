import type { Request, Response } from 'express'
import { registerSchema } from './auth.schema.js'
import { getProfile, registerUser } from './auth.service.js'
import { AppError } from '../../shared/errors.js'
import { parse } from 'node:path'

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Datos inválidos')
    }
    const profile = await registerUser(parsed.data)
    res.status(201).json({ data: profile })
}

export async function me(req: Request, res: Response) {
    const profile = await getProfile(req.user!.uid);
    res.json({ data: profile });
}