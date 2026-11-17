import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import type { ApiResponse, RegisterPayload, Role, UserProfile } from '~/types'
import { findMockUserByEmail, findMockUserByUid, mockTokenFor } from '~/utils/mocks'

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const useMocks = Boolean(config.public.useMocks)
  const mockUid = useCookie<string | null>('eventpass-mock-uid', {
    default: () => null,
    sameSite: 'lax',
  })

  const user = ref<UserProfile | null>(null)
  const role = ref<Role | null>(null)
  const ready = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const isOrganizer = computed(() => role.value === 'organizer')
  const isAttendee = computed(() => role.value === 'attendee')

  let firebaseAuth: Auth | null = null
  let resolveReady: () => void = () => {}
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  function markReady() {
    if (!ready.value) {
      ready.value = true
      resolveReady()
    }
  }

  function waitUntilReady() {
    return readyPromise
  }

  function requireFirebase(): Auth {
    if (!firebaseAuth) {
      throw new Error('Firebase Auth no está inicializado')
    }
    return firebaseAuth
  }

  async function fetchProfile() {
    const response = await useApi()<ApiResponse<UserProfile>>('/auth/me')
    return response.data
  }

  async function loadSession(firebaseUser: User | null, rethrow = false) {
    if (!firebaseUser) {
      clearSession()
      return
    }

    const tokenResult = await firebaseUser.getIdTokenResult()
    role.value = (tokenResult.claims.role as Role | undefined) ?? null

    try {
      user.value = await fetchProfile()
      role.value = user.value.role
    } catch (error) {
      clearSession()
      if (rethrow) throw error
    }
  }

  function clearSession() {
    user.value = null
    role.value = null
    mockUid.value = null
  }

  function restoreMockSession() {
    const profile = mockUid.value ? findMockUserByUid(mockUid.value) : null
    if (profile) {
      user.value = profile
      role.value = profile.role
    } else {
      clearSession()
    }
    markReady()
  }

  function startMockSession(profile: UserProfile) {
    mockUid.value = profile.uid
    user.value = profile
    role.value = profile.role
  }

  function init(auth: Auth) {
    firebaseAuth = auth
    onAuthStateChanged(auth, async (firebaseUser) => {
      loading.value = true
      try {
        await loadSession(firebaseUser)
      } finally {
        loading.value = false
        markReady()
      }
    })
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    try {
      await useApi()<ApiResponse<UserProfile>>('/auth/register', {
        method: 'POST',
        body: { ...payload },
      })
      await login(payload.email, payload.password)
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      if (useMocks) {
        const profile = findMockUserByEmail(email)
        if (!profile || password.length < 6) {
          throw Object.assign(new Error('auth/invalid-credential'), { code: 'auth/invalid-credential' })
        }
        startMockSession(profile)
        return
      }

      const firebase = requireFirebase()
      const credential = await signInWithEmailAndPassword(firebase, email, password)
      try {
        await loadSession(credential.user, true)
      } catch (error) {
        await signOut(firebase)
        throw error
      }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (!useMocks) {
      await signOut(requireFirebase())
    }
    clearSession()
  }

  async function getToken(): Promise<string | null> {
    if (useMocks) {
      return user.value ? mockTokenFor(user.value.uid) : null
    }
    return (await firebaseAuth?.currentUser?.getIdToken()) ?? null
  }

  if (useMocks) {
    restoreMockSession()
  }

  return {
    user,
    role,
    ready,
    loading,
    isAuthenticated,
    isOrganizer,
    isAttendee,
    init,
    waitUntilReady,
    register,
    login,
    logout,
    getToken,
  }
})
