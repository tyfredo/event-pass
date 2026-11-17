import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth'
import type { ApiResponse, RegisterPayload, Role, UserProfile } from '~/types'
import type { UserRole } from '~/types/events'
import { findMockUserByEmail, findMockUserByUid, mockTokenFor } from '~/utils/mocks'

export type ProfileKey = 'organizer-a' | 'organizer-b' | 'attendee'

export interface MockUserProfile {
  key: ProfileKey
  id: string
  name: string
  role: UserRole
  token: string
}

const PROFILES: Record<ProfileKey, MockUserProfile> = {
  'organizer-a': {
    key: 'organizer-a',
    id: 'org-a',
    name: 'Organizador A (Ana Gómez)',
    role: 'organizer',
    token: 'mock-organizer-a',
  },
  'organizer-b': {
    key: 'organizer-b',
    id: 'org-b',
    name: 'Organizador B (Carlos Ruiz)',
    role: 'organizer',
    token: 'mock-organizer-b',
  },
  attendee: {
    key: 'attendee',
    id: 'att-1',
    name: 'Asistente (Laura Pérez)',
    role: 'attendee',
    token: 'mock-attendee',
  },
}

const DEFAULT_PROFILE_KEY: ProfileKey = 'organizer-a'

export function isProfileKey(value: unknown): value is ProfileKey {
  return typeof value === 'string' && Object.hasOwn(PROFILES, value)
}

export const useAuthStore = defineStore('auth', () => {
  const config = useRuntimeConfig()
  const useMocks = Boolean(config.public.useMocks)

  const mockUid = useCookie<string | null>('eventpass-mock-uid', {
    default: () => null,
    sameSite: 'lax',
  })

  const profileCookie = useCookie<string>('mock-profile', {
    default: () => DEFAULT_PROFILE_KEY,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  const user = ref<UserProfile | null>(null)
  const firebaseRole = ref<Role | null>(null)
  const ready = ref(false)
  const loading = ref(false)

  const currentProfileKey = computed<ProfileKey>(() =>
    isProfileKey(profileCookie.value) ? profileCookie.value : DEFAULT_PROFILE_KEY
  )

  const activeMockProfile = computed<MockUserProfile | null>(() => {
    if (!import.meta.dev && !useMocks) return null
    return isProfileKey(profileCookie.value) ? PROFILES[profileCookie.value] : null
  })

  const role = computed<Role | null>(() => {
    if (user.value) return firebaseRole.value
    return (activeMockProfile.value?.role as Role | undefined) ?? null
  })

  const isAuthenticated = computed(() => user.value !== null || activeMockProfile.value !== null)
  const isOrganizer = computed(() => role.value === 'organizer')
  const isAttendee = computed(() => role.value === 'attendee')

  const currentUser = computed<MockUserProfile>(() => {
    if (user.value) {
      const profileData = user.value as UserProfile & { name?: string; email?: string }
      return {
        key: currentProfileKey.value,
        id: user.value.uid,
        name: profileData.name ?? profileData.email ?? 'Usuario',
        role: (firebaseRole.value === 'organizer' ? 'organizer' : 'attendee') as UserRole,
        token: useMocks ? mockTokenFor(user.value.uid) : '',
      }
    }
    return activeMockProfile.value ?? PROFILES[DEFAULT_PROFILE_KEY]
  })

  const authHeader = computed<Record<string, string>>(() =>
    currentUser.value.token ? { Authorization: `Bearer ${currentUser.value.token}` } : {}
  )

  const availableProfiles = computed<MockUserProfile[]>(() => Object.values(PROFILES))

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
    firebaseRole.value = (tokenResult.claims.role as Role | undefined) ?? null

    try {
      user.value = await fetchProfile()
      firebaseRole.value = user.value.role
    } catch (error) {
      clearSession()
      if (rethrow) throw error
    }
  }

  function clearSession() {
    user.value = null
    firebaseRole.value = null
    mockUid.value = null
  }

  function restoreMockSession() {
    const profile = mockUid.value ? findMockUserByUid(mockUid.value) : null
    if (profile) {
      user.value = profile
      firebaseRole.value = profile.role
    } else {
      clearSession()
    }
    markReady()
  }

  function startMockSession(profile: UserProfile) {
    mockUid.value = profile.uid
    user.value = profile
    firebaseRole.value = profile.role
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
    if (!useMocks && firebaseAuth) {
      await signOut(firebaseAuth)
    }
    clearSession()
    profileCookie.value = ''
  }

  async function getToken(): Promise<string | null> {
    if (useMocks && user.value) {
      return mockTokenFor(user.value.uid)
    }
    const firebaseToken = await firebaseAuth?.currentUser?.getIdToken()
    if (firebaseToken) {
      return firebaseToken
    }
    return activeMockProfile.value?.token ?? null
  }

  function switchProfile(key: ProfileKey): void {
    clearSession()
    profileCookie.value = key
    markReady()
  }

  if (useMocks) {
    restoreMockSession()
  } else if (!config.public.firebase?.apiKey) {
    markReady()
  }

  return {
    user,
    role,
    ready,
    loading,
    isAuthenticated,
    isOrganizer,
    isAttendee,
    currentProfileKey,
    currentUser,
    authHeader,
    availableProfiles,
    init,
    waitUntilReady,
    register,
    login,
    logout,
    getToken,
    switchProfile,
  }
})