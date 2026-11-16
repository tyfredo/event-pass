interface User {
  uid: string
  fullName: string
  email: string
  role: 'attendee' | 'organizer'
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => Boolean(accessToken.value))

  const setSession = (token: string, nextUser: User) => {
    accessToken.value = token
    user.value = nextUser
  }

  const clearSession = () => {
    accessToken.value = null
    user.value = null
  }

  return { accessToken, user, isAuthenticated, setSession, clearSession }
})
