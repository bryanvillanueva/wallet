import { create } from 'zustand'
import type { Account } from '../lib/api'

interface WalletState {
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (id: number, updates: Partial<Account>) => void
  clearAccounts: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  accounts: [],

  setAccounts: (accounts) => set({ accounts }),

  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
    })),

  updateAccount: (id, updates) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...updates } : acc
      ),
    })),

  clearAccounts: () => set({ accounts: [] }),
}))
