export default defineNuxtRouteMiddleware(async (to) => {
  const auth = await resolveSession()
  if (!auth) return

  if (!auth.isAuthenticated) {
    return loginRedirect(to)
  }
})
