import express from 'express'
import { ApiRouter } from './routes'
import { AppError } from './shared/errors'

export const app = express()
app.use(express.json())
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'eventpass-api' })
})
app.use('/api', ApiRouter)

// Temporal hasta que Dev 2 entregue el middleware oficial 
app.use((err: unknown, _req: any, res: any, _next: any) => {
    if (err instanceof AppError) {
        return res.status(err.status).json({
            code: err.code,
            message: err.message
        })
    }
    console.error(err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Error interno'
        }
    })
})
