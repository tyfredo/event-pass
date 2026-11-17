import type { ApiRequestOptions } from '~/types'
import { toApiRequestError } from '~/utils/apiErrors'
import { mockRequest } from '~/utils/mocks'

export const useApi = () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const client = $fetch.create({
    baseURL: config.public.apiBase,
    async onRequest({ options }) {
      const token = await auth.getToken()
      if (token) {
        options.headers = new Headers(options.headers)
        options.headers.set('Authorization', `Bearer ${token}`)
      }
    },
  })

  return async <T>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
    try {
      if (config.public.useMocks) {
        return await mockRequest<T>(url, options, await auth.getToken())
      }
      return await client<T>(url, options)
    } catch (error) {
      throw toApiRequestError(error)
    }
  }
}
