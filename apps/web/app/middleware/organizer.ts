// Solo mejora la UX: la autorización real la impone la API (401/403).
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = await resolveSession();
  if (!auth) return;

  if (!auth.isAuthenticated) {
    return loginRedirect(to);
  }

  if (!auth.isOrganizer) {
    return navigateTo({
      path: homeForRole(auth.role),
      query: { unauthorized: '1' },
    });
  }
});