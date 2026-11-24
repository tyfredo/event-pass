import type { ApiResponse } from '~/types'
import type { Pass } from '~/types/pass'
import type { Registration } from '~/types/registration'
import { ApiRequestError, toApiRequestError } from '~/utils/apiErrors'

export const getErrorMessage = (error: unknown): string => {
  const cause = (error as { cause?: unknown } | null)?.cause
  return toApiRequestError(cause instanceof ApiRequestError ? cause : error).message
}

export const passPath = (registrationId: string) => `/registrations/${encodeURIComponent(registrationId)}/pass`

export const useRegistrations = () => {
  const api = useApi()

  const register = async (eventId: string) => {
    const response = await api<ApiResponse<Registration>>('/registrations', {
      method: 'POST',
      body: { eventId },
    })
    return response.data
  }

  const listMine = async () => {
    const response = await api<ApiResponse<Registration[]>>('/registrations/me')
    return response.data
  }

  const listByEvent = async (eventId: string) => {
    const response = await api<ApiResponse<Registration[]>>(`/events/${encodeURIComponent(eventId)}/registrations`)
    return response.data
  }

  const getPass = async (registrationId: string) => {
    const response = await api<ApiResponse<Pass>>(`/registrations/${encodeURIComponent(registrationId)}`)
    return response.data
  }

  const cancel = async (registrationId: string) => {
    const response = await api<ApiResponse<Registration>>(
      `/registrations/${encodeURIComponent(registrationId)}/cancel`,
      { method: 'PATCH' },
    )
    return response.data
  }

  return { register, listMine, listByEvent, getPass, cancel }
}
