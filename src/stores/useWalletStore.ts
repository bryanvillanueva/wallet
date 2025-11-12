import { create } from 'zustand'
import type { Account, Category, PayPeriod, Transaction, SavingEntry, SavingGoal } from '../lib/api'

interface WalletState {
  // Accounts (Phase 2)
  accounts: Account[]
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void
  updateAccount: (id: number, updates: Partial<Account>) => void
  clearAccounts: () => void

  // Categories (Phase 3)
  categories: Category[]
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void
  clearCategories: () => void

  // Pay Periods (Phase 4)
  payPeriods: PayPeriod[]
  setPayPeriods: (payPeriods: PayPeriod[]) => void
  addPayPeriod: (payPeriod: PayPeriod) => void
  updatePayPeriod: (id: number, updates: Partial<PayPeriod>) => void
  clearPayPeriods: () => void

  // Transactions (Phase 5)
  transactions: Transaction[]
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  removeTransaction: (id: number) => void
  clearTransactions: () => void

  // Saving Entries (Phase 7)
  savingEntries: SavingEntry[]
  setSavingEntries: (entries: SavingEntry[]) => void
  addSavingEntry: (entry: SavingEntry) => void
  clearSavingEntries: () => void

  // Saving Goals (Phase 8)
  savingGoals: SavingGoal[]
  setSavingGoals: (goals: SavingGoal[]) => void
  addSavingGoal: (goal: SavingGoal) => void
  updateSavingGoal: (id: number, updates: Partial<SavingGoal>) => void
  removeSavingGoal: (id: number) => void
  clearSavingGoals: () => void
}

export const useWalletStore = create<WalletState>((set) => ({
  // Accounts
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

  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),
  clearCategories: () => set({ categories: [] }),

  // Pay Periods
  payPeriods: [],
  setPayPeriods: (payPeriods) => set({ payPeriods }),
  addPayPeriod: (payPeriod) =>
    set((state) => ({
      payPeriods: [...state.payPeriods, payPeriod],
    })),
  updatePayPeriod: (id, updates) =>
    set((state) => ({
      payPeriods: state.payPeriods.map((pp) =>
        pp.id === id ? { ...pp, ...updates } : pp
      ),
    })),
  clearPayPeriods: () => set({ payPeriods: [] }),

  // Transactions
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [...state.transactions, transaction],
    })),
  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((txn) => txn.id !== id),
    })),
  clearTransactions: () => set({ transactions: [] }),

  // Saving Entries
  savingEntries: [],
  setSavingEntries: (entries) => set({ savingEntries: entries }),
  addSavingEntry: (entry) =>
    set((state) => ({
      savingEntries: [...state.savingEntries, entry],
    })),
  clearSavingEntries: () => set({ savingEntries: [] }),

  // Saving Goals
  savingGoals: [],
  setSavingGoals: (goals) => set({ savingGoals: goals }),
  addSavingGoal: (goal) =>
    set((state) => ({
      savingGoals: [...state.savingGoals, goal],
    })),
  updateSavingGoal: (id, updates) =>
    set((state) => ({
      savingGoals: state.savingGoals.map((goal) =>
        goal.id === id ? { ...goal, ...updates } : goal
      ),
    })),
  removeSavingGoal: (id) =>
    set((state) => ({
      savingGoals: state.savingGoals.filter((goal) => goal.id !== id),
    })),
  clearSavingGoals: () => set({ savingGoals: [] }),
}))
