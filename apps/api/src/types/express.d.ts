export type Role = 'attendee' | 'organizer'

declare global {
    namespace Express {
        interface Request {
            user?: { uid: string; email?: string; role?: Role };
        }
    }
}

export { };