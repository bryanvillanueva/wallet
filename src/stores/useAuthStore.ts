import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  activeUserId: number | null
  setActiveUserId: (userId: number | null) => void
  clearActiveUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      activeUserId: null,

      setActiveUserId: (userId) => set({ activeUserId: userId }),

      clearActiveUser: () => set({ activeUserId: null }),
    }),
    {
      name: 'wallet-auth-storage', // nombre en localStorage
    }
  )
)
