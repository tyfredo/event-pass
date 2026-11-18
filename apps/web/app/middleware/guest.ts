export default defineNuxtRouteMiddleware(async () => {
  const auth = await resolveSession()
  if (!auth) return

  if (auth.isAuthenticated) {
    return navigateTo(homeForRole(auth.role))
  }
})
