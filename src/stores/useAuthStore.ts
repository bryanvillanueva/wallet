import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  activeUserId: number | null
  activeUserName: string | null
  setActiveUser: (userId: number | null, userName: string | null) => void
  setActiveUserId: (userId: number | null) => void
  clearActiveUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      activeUserId: null,
      activeUserName: null,

      setActiveUser: (userId, userName) => set({ activeUserId: userId, activeUserName: userName }),

      setActiveUserId: (userId) => set({ activeUserId: userId }),

      clearActiveUser: () => set({ activeUserId: null, activeUserName: null }),
    }),
    {
      name: 'wallet-auth-storage',
    }
  )
)
