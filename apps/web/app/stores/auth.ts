import { computed } from 'vue';
import { defineStore } from 'pinia';
import type { UserRole } from '~/types/events';

export type ProfileKey = 'organizer-a' | 'organizer-b' | 'attendee';

export interface MockUserProfile {
  key: ProfileKey;
  id: string;
  name: string;
  role: UserRole;
  token: string;
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
};

const DEFAULT_PROFILE_KEY: ProfileKey = 'organizer-a';

export function isProfileKey(value: unknown): value is ProfileKey {
  return typeof value === 'string' && Object.hasOwn(PROFILES, value);
}

export const useAuthStore = defineStore('auth', () => {
  // Cookie (no localStorage): el servidor también la lee, así SSR y cliente coinciden
  // y el perfil elegido sobrevive a un F5 sin errores de hidratación.
  const profileCookie = useCookie<string>('mock-profile', {
    default: () => DEFAULT_PROFILE_KEY,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });

  // Se valida el valor: una cookie manipulada cae al perfil por defecto.
  const currentProfileKey = computed<ProfileKey>(() =>
    isProfileKey(profileCookie.value) ? profileCookie.value : DEFAULT_PROFILE_KEY
  );
  const currentUser = computed<MockUserProfile>(() => PROFILES[currentProfileKey.value]);
  const isOrganizer = computed(() => currentUser.value.role === 'organizer');
  const authHeader = computed<Record<string, string>>(() => ({
    Authorization: `Bearer ${currentUser.value.token}`,
  }));
  const availableProfiles = computed<MockUserProfile[]>(() => Object.values(PROFILES));

  function switchProfile(key: ProfileKey): void {
    profileCookie.value = key;
  }

  return { currentProfileKey, currentUser, isOrganizer, authHeader, availableProfiles, switchProfile };
});
