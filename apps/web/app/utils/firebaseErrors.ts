import { ApiRequestError } from '~/utils/apiErrors'

const firebaseErrorMessages: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/user-disabled': 'Esta cuenta fue deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
  'auth/email-already-in-use': 'Ese correo ya está registrado.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/operation-not-allowed': 'El inicio de sesión con correo no está habilitado.',
  'auth/invalid-api-key': 'La configuración de Firebase no es válida.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'La configuración de Firebase no es válida.',
  'auth/internal-error': 'Ocurrió un error inesperado, inténtalo de nuevo.',
}

const fallbackMessage = 'No se pudo completar la operación.'

export function translateFirebaseError(code: string | undefined): string {
  return (code && firebaseErrorMessages[code]) || fallbackMessage
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message
  }
  const code = (error as { code?: unknown } | null)?.code
  return translateFirebaseError(typeof code === 'string' ? code : undefined)
}
