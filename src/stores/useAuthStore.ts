import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '../lib/api'

interface AuthState {
  token: string | null
  user: AuthUser | null
  activeUserId: number | null
  activeUserName: string | null

  login: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeUserId: null,
      activeUserName: null,

      login: (token, user) =>
        set({
          token,
          user,
          activeUserId: user.id,
          activeUserName: user.name,
        }),

      logout: () =>
        set({
          token: null,
          user: null,
          activeUserId: null,
          activeUserName: null,
        }),
    }),
    {
      name: 'wallet-auth-storage',
    }
  )
)
