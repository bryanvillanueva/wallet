# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal finance management app (Wallet) built with React 19 + TypeScript + Vite. Uses a modern fintech design system with purple/magenta accent. Connects to a REST API backend hosted on Railway.

## Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript check + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

### API Layer (`src/lib/api.ts`)
- Centralized `apiFetch<T>()` wrapper with `ApiError` class for error handling
- **All API responses validated with Zod schemas** - schemas are defined alongside API functions
- Organized by feature phases (Health → Users → Accounts → Categories → PayPeriods → Transactions → Savings → Goals → Summary)
- Base URL from `VITE_API_BASE` env variable (defaults to production Railway URL)

### State Management (Zustand)
Two separate stores:
- **`useAuthStore`**: Persisted to localStorage (`wallet-auth-storage`). Holds `activeUserId`.
- **`useWalletStore`**: In-memory, non-persisted. Holds accounts, categories, payPeriods, transactions, savingEntries, savingGoals with CRUD operations.

### Navigation Pattern
- `App.tsx` uses `useState<Screen>` for tab-based navigation (no router)
- When `activeUserId` is null, renders `<Onboarding />` instead of main app
- Screens are full-page views in `src/screens/`

### Design System (Fintech)
CSS classes defined in `src/index.css`:

**Active classes (fintech style):**
- `.fintech-card` - Clean white cards with subtle shadow (`box-shadow: 0 2px 12px rgba(0,0,0,0.06)`)
- `.fintech-input` - Inputs with `#f5f5f7` background, purple focus ring (`border-color: #d821f9`)
- `.fintech-btn-primary` - Purple gradient button (`linear-gradient(135deg, #d821f9, #b01cd4)`)
- `.fintech-btn-secondary` - Gray background button (`#f5f5f7`)

**Legacy classes (still defined but rarely used):**
- `.glass-card`, `.glass-card-light`, `.glass-card-dark` - Glassmorphism containers with backdrop blur
- `.glass-button`, `.glass-input` - Glass-style interactive elements

**Primary color:** `#d821f9` (magenta/purple)
- Header gradients: `bg-gradient-to-br from-[#d821f9] to-[#a018c0]`
- Onboarding gradient: `from-[#d821f9] to-[#7a0fa8]`
- Active nav/tab indicators: `text-[#d821f9]`, `bg-[#d821f9]`

**App background:** `#f5f5f7` (light gray), cards on `#ffffff`

Common styling patterns:
- Rounded corners: `rounded-2xl` (cards), `rounded-3xl` (auth card, modals), `rounded-[32px]` (headers)
- Text hierarchy: `text-gray-800` (primary), `text-gray-400`–`text-gray-600` (secondary), `text-white` (on headers)
- Account type colors: green (cash), blue (bank), orange (credit), purple (savings)
- Goal category colors: each category has its own color (sky, orange, indigo, violet, etc.)

### Forms
- React Hook Form + `@hookform/resolvers` for form state
- Zod schemas (same as API) for validation

## Key Conventions

- **Amounts in cents**: All monetary values stored as integers (`amount_cents`, `gross_income_cents`, etc.)
- **Dates as strings**: Format `YYYY-MM-DD` for all date fields
- **Spanish UI**: Interface text is in Spanish
- **Type-first**: Define Zod schema → derive TypeScript type with `z.infer<>`

## Environment

Copy `.env.example` to `.env` for local development:
```
VITE_API_BASE=http://localhost:4000/api  # Local backend
```
