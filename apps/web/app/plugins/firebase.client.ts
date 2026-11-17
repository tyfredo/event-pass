import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  if (config.public.useMocks) {
    return
  }

  const { apiKey, authDomain, projectId, appId } = config.public.firebase

  const firebaseApp = getApps().length
    ? getApp()
    : initializeApp({ apiKey, authDomain, projectId, appId })

  const firebaseAuth = getAuth(firebaseApp)

  useAuthStore().init(firebaseAuth)

  return {
    provide: {
      firebaseAuth,
    },
  }
})
