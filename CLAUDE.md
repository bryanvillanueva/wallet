# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal finance management app (Wallet) built with React 19 + TypeScript + Vite. Uses a glassmorphism/liquid glass design system. Connects to a REST API backend hosted on Railway.

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

### Design System (Glassmorphism)
CSS classes defined in `src/index.css`:
- `.glass-card`, `.glass-card-light`, `.glass-card-dark` - Container styles with backdrop blur
- `.glass-button` - Interactive buttons with hover effects
- `.glass-input` - Form inputs with focus glow

Color tokens (Tailwind `@theme`):
- Light accent: `#22d3ee` (cyan)
- Dark accent: `#4da3ff` (blue)

Common styling patterns:
- Gradients for active states: `bg-gradient-to-r from-[#22d3ee] to-[#06b6d4]` (light) / `from-[#4da3ff] to-[#3b82f6]` (dark)
- Rounded corners: `rounded-2xl` (standard), `rounded-3xl` (large)
- Background gradient: `bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#dbeafe]` (light)

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
