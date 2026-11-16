import { useAuthStore } from '~/stores/auth';

// Solo mejora la UX: la autorización real la impone la API (401/403).
export default defineNuxtRouteMiddleware(() => {
  const auth = useAuthStore();

  if (!auth.isOrganizer) {
    return navigateTo({ path: '/events', query: { unauthorized: '1' } });
  }
});
