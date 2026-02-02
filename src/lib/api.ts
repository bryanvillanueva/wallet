import { z } from 'zod'

// Base URL configurable por entorno
const BASE_URL = import.meta.env.VITE_API_BASE ?? 'https://wallet-api-production-2e8a.up.railway.app/api'

// ============================================================
// UTILITY: Fetch wrapper con manejo de errores + JWT
// ============================================================

class ApiError extends Error {
  status: number
  data?: unknown

  constructor(
    message: string,
    status: number,
    data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Lee el token JWT del localStorage (Zustand persist)
function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('wallet-auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

// Callback global para manejar 401 (sesión expirada)
let _onUnauthorized: (() => void) | null = null
export function onUnauthorized(cb: () => void) {
  _onUnauthorized = cb
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`
  const token = getStoredToken()

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)

      // Si hay token almacenado y recibimos 401, la sesión expiró
      if (response.status === 401 && token && _onUnauthorized) {
        _onUnauthorized()
      }

      throw new ApiError(
        errorData?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      0
    )
  }
}

// ============================================================
// PHASE 0: HEALTH & INFRA
// ============================================================

export const HealthSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  ts: z.string().or(z.number()).optional(),
})

export const DbPingSchema = z.object({
  ok: z.boolean(),
})

export type HealthResponse = z.infer<typeof HealthSchema>
export type DbPingResponse = z.infer<typeof DbPingSchema>

export const healthApi = {
  /**
   * GET /api/health
   * Verifica que el servicio está vivo
   */
  async check(): Promise<HealthResponse> {
    const data = await apiFetch<HealthResponse>('/health')
    return HealthSchema.parse(data)
  },

  /**
   * GET /api/db-ping
   * Valida conexión con MySQL
   */
  async dbPing(): Promise<DbPingResponse> {
    const data = await apiFetch<DbPingResponse>('/db-ping')
    return DbPingSchema.parse(data)
  },
}

// ============================================================
// PHASE 1: USERS
// ============================================================

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable().optional(),
  created_at: z.string().optional(),
})

export const CreateUserInputSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').nullable().optional(),
})

export const CreateUserResponseSchema = z.object({
  id: z.number(),
})

export type User = z.infer<typeof UserSchema>
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>

export const usersApi = {
  /**
   * POST /api/users
   * Crea un nuevo usuario
   */
  async create(input: CreateUserInput): Promise<CreateUserResponse> {
    const validated = CreateUserInputSchema.parse(input)
    const data = await apiFetch<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return CreateUserResponseSchema.parse(data)
  },

  /**
   * GET /api/users/:id
   * Obtiene un usuario por ID
   */
  async getById(id: number): Promise<User> {
    const data = await apiFetch<User>(`/users/${id}`)
    return UserSchema.parse(data)
  },

  /**
   * GET /api/users (opcional)
   * Lista todos los usuarios
   */
  async list(): Promise<User[]> {
    const data = await apiFetch<User[]>('/users')
    return z.array(UserSchema).parse(data)
  },
}

// ============================================================
// AUTH: Autenticación JWT
// ============================================================

export const AuthUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  role: z.string(),
  created_at: z.string().optional(),
})

export const AuthResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: AuthUserSchema,
})

export const LoginInputSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const RegisterInputSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const ChangePasswordInputSchema = z.object({
  current_password: z.string().min(1, 'La contraseña actual es requerida'),
  new_password: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
})

export type AuthUser = z.infer<typeof AuthUserSchema>
export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type LoginInput = z.infer<typeof LoginInputSchema>
export type RegisterInput = z.infer<typeof RegisterInputSchema>
export type ChangePasswordInput = z.infer<typeof ChangePasswordInputSchema>

export const authApi = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const validated = RegisterInputSchema.parse(input)
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return AuthResponseSchema.parse(data)
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const validated = LoginInputSchema.parse(input)
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return AuthResponseSchema.parse(data)
  },

  async me(): Promise<AuthUser> {
    const data = await apiFetch<AuthUser>('/auth/me')
    return AuthUserSchema.parse(data)
  },

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const validated = ChangePasswordInputSchema.parse(input)
    return apiFetch<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(validated),
    })
  },
}

// ============================================================
// PHASE 2: ACCOUNTS
// ============================================================

export const AccountSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  type: z.enum(['cash', 'bank', 'credit', 'savings']),
  currency: z.string().default('AUD'),
  is_active: z.union([z.boolean(), z.number()]).transform((val) => Boolean(val)),
  created_at: z.string().optional(),
})

export const CreateAccountInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(['cash', 'bank', 'credit', 'savings'], {
    message: 'Tipo de cuenta inválido',
  }),
  currency: z.string().length(3, 'La moneda debe tener 3 letras').optional().default('AUD'),
  is_active: z.boolean().optional().default(true),
})

export const UpdateAccountInputSchema = z.object({
  name: z.string().min(2).optional(),
  is_active: z.boolean().optional(),
  currency: z.string().length(3).optional(),
})

export const CreateAccountResponseSchema = z.object({
  id: z.number(),
})

export type Account = z.infer<typeof AccountSchema>
export type CreateAccountInput = z.infer<typeof CreateAccountInputSchema>
export type UpdateAccountInput = z.infer<typeof UpdateAccountInputSchema>
export type CreateAccountResponse = z.infer<typeof CreateAccountResponseSchema>

export const accountsApi = {
  /**
   * GET /api/accounts/user/:userId
   * Lista todas las cuentas de un usuario
   */
  async listByUser(userId: number): Promise<Account[]> {
    const data = await apiFetch<Account[]>(`/accounts/user/${userId}`)
    return z.array(AccountSchema).parse(data)
  },

  /**
   * POST /api/accounts
   * Crea una nueva cuenta
   */
  async create(input: CreateAccountInput): Promise<CreateAccountResponse> {
    const validated = CreateAccountInputSchema.parse(input)
    const data = await apiFetch<CreateAccountResponse>('/accounts', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return CreateAccountResponseSchema.parse(data)
  },

  /**
   * PATCH /api/accounts/:id
   * Actualiza una cuenta (activar/desactivar, renombrar)
   */
  async update(id: number, input: UpdateAccountInput): Promise<{ updated: boolean }> {
    const validated = UpdateAccountInputSchema.parse(input)
    const data = await apiFetch<{ updated: boolean }>(`/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(validated),
    })
    return data
  },
}

// ============================================================
// PHASE 3: CATEGORIES
// ============================================================

export const CategorySchema = z.object({
  id: z.number(),
  user_id: z.number().nullable(),
  name: z.string(),
  kind: z.enum(['income', 'expense', 'transfer', 'adjustment']),
})

export const CreateCategoryInputSchema = z.object({
  user_id: z.number().nullable().optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  kind: z.enum(['income', 'expense', 'transfer', 'adjustment'], {
    message: 'Tipo de categoría inválido',
  }),
})

export const CreateCategoryResponseSchema = z.object({
  id: z.number(),
})

export type Category = z.infer<typeof CategorySchema>
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>
export type CreateCategoryResponse = z.infer<typeof CreateCategoryResponseSchema>

export const categoriesApi = {
  /**
   * GET /api/categories?user_id=X
   * Lista categorías globales + personales del usuario
   */
  async list(userId?: number): Promise<Category[]> {
    const url = userId ? `/categories?user_id=${userId}` : '/categories'
    const data = await apiFetch<Category[]>(url)
    return z.array(CategorySchema).parse(data)
  },

  /**
   * POST /api/categories
   * Crea una categoría personal
   */
  async create(input: CreateCategoryInput): Promise<CreateCategoryResponse> {
    const validated = CreateCategoryInputSchema.parse(input)
    const data = await apiFetch<CreateCategoryResponse>('/categories', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return CreateCategoryResponseSchema.parse(data)
  },
}

// ============================================================
// PHASE 4: PAY PERIODS
// ============================================================

export const PayPeriodSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  pay_date: z.string(), // YYYY-MM-DD
  gross_income_cents: z.number().nullable(),
  note: z.string().nullable(),
  created_at: z.string().optional(),
})

export const UpsertPayPeriodInputSchema = z.object({
  user_id: z.number(),
  pay_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  gross_income_cents: z.number().min(0, 'El ingreso debe ser positivo').optional().nullable(),
  note: z.string().optional().nullable(),
})

export const UpsertPayPeriodResponseSchema = z.object({
  id: z.number(),
})

export type PayPeriod = z.infer<typeof PayPeriodSchema>
export type UpsertPayPeriodInput = z.infer<typeof UpsertPayPeriodInputSchema>
export type UpsertPayPeriodResponse = z.infer<typeof UpsertPayPeriodResponseSchema>

export const payPeriodsApi = {
  /**
   * GET /api/pay-periods/user/:userId
   * Lista todas las quincenas de un usuario
   */
  async listByUser(userId: number): Promise<PayPeriod[]> {
    const data = await apiFetch<PayPeriod[]>(`/pay-periods/user/${userId}`)
    return z.array(PayPeriodSchema).parse(data)
  },

  /**
   * POST /api/pay-periods (upsert)
   * Crea o actualiza una quincena
   */
  async upsert(input: UpsertPayPeriodInput): Promise<UpsertPayPeriodResponse> {
    const validated = UpsertPayPeriodInputSchema.parse(input)
    const data = await apiFetch<UpsertPayPeriodResponse>('/pay-periods', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return UpsertPayPeriodResponseSchema.parse(data)
  },
}

// ============================================================
// PHASE 5: TRANSACTIONS
// ============================================================

export const TransactionSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  pay_period_id: z.number().nullable(),
  account_id: z.number(),
  category_id: z.number().nullable(),
  type: z.enum(['income', 'expense', 'transfer', 'adjustment']),
  amount_cents: z.number(), // Con signo: income/adjustment >0, expense/transfer <0
  description: z.string().nullable(),
  txn_date: z.string(), // YYYY-MM-DD
  planned_payment_id: z.number().nullable(),
  counterparty_user_id: z.number().nullable(),
  created_at: z.string().optional(),
})

export const CreateTransactionInputSchema = z.object({
  user_id: z.number(),
  pay_period_id: z.number().optional().nullable(),
  account_id: z.number(),
  category_id: z.number().optional().nullable(),
  type: z.enum(['income', 'expense', 'transfer', 'adjustment'], {
    message: 'Tipo de transacción inválido',
  }),
  amount_cents: z.number(),
  description: z.string().optional().nullable(),
  txn_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  planned_payment_id: z.number().optional().nullable(),
  counterparty_user_id: z.number().optional().nullable(),
})

export const CreateTransactionResponseSchema = z.object({
  id: z.number(),
})

export type Transaction = z.infer<typeof TransactionSchema>
export type CreateTransactionInput = z.infer<typeof CreateTransactionInputSchema>
export type CreateTransactionResponse = z.infer<typeof CreateTransactionResponseSchema>

export interface ListTransactionsParams {
  userId: number
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
  pay_period_id?: number
  limit?: number
  offset?: number
}

export const transactionsApi = {
  /**
   * GET /api/transactions/user/:userId con filtros opcionales
   * Lista transacciones de un usuario
   */
  async list(params: ListTransactionsParams): Promise<Transaction[]> {
    const { userId, from, to, pay_period_id, limit, offset } = params
    const queryParams = new URLSearchParams()

    if (from) queryParams.append('from', from)
    if (to) queryParams.append('to', to)
    if (pay_period_id) queryParams.append('pay_period_id', pay_period_id.toString())
    if (limit) queryParams.append('limit', limit.toString())
    if (offset) queryParams.append('offset', offset.toString())

    const query = queryParams.toString()
    const url = `/transactions/user/${userId}${query ? `?${query}` : ''}`

    const data = await apiFetch<Transaction[]>(url)
    return z.array(TransactionSchema).parse(data)
  },

  /**
   * POST /api/transactions
   * Crea una nueva transacción
   */
  async create(input: CreateTransactionInput): Promise<CreateTransactionResponse> {
    const validated = CreateTransactionInputSchema.parse(input)
    const data = await apiFetch<CreateTransactionResponse>('/transactions', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return CreateTransactionResponseSchema.parse(data)
  },

  /**
   * DELETE /api/transactions/:id (opcional)
   * Elimina una transacción
   */
  async delete(id: number): Promise<{ deleted: boolean }> {
    const data = await apiFetch<{ deleted: boolean }>(`/transactions/${id}`, {
      method: 'DELETE',
    })
    return data
  },
}

// ============================================================
// PHASE 7: SAVINGS (Entradas de ahorro)
// ============================================================

export const SavingEntrySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  pay_period_id: z.number().nullable(),
  account_id: z.number(),
  amount_cents: z.number(), // >0 depósito, <0 retiro
  entry_date: z.string(), // YYYY-MM-DD
  note: z.string().nullable(),
  created_at: z.string().optional(),
})

export const CreateSavingEntryInputSchema = z.object({
  user_id: z.number(),
  pay_period_id: z.number().optional().nullable(),
  account_id: z.number(),
  amount_cents: z.number(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  note: z.string().optional().nullable(),
  goal_id: z.number().optional().nullable(),
  goal_amount_cents: z.number().optional().nullable(),
})

export const CreateSavingEntryResponseSchema = z.object({
  id: z.number(),
  goal_linked: z.boolean().optional(),
  goal_amount_cents: z.number().optional(),
})

export type SavingEntry = z.infer<typeof SavingEntrySchema>
export type CreateSavingEntryInput = z.infer<typeof CreateSavingEntryInputSchema>
export type CreateSavingEntryResponse = z.infer<typeof CreateSavingEntryResponseSchema>

export interface ListSavingEntriesParams {
  userId: number
  pay_period_id?: number
  from?: string // YYYY-MM-DD
  to?: string // YYYY-MM-DD
}

export const savingsApi = {
  /**
   * GET /api/savings/entries/user/:userId con filtros opcionales
   * Lista entradas de ahorro de un usuario
   */
  async listEntries(params: ListSavingEntriesParams): Promise<SavingEntry[]> {
    const { userId, pay_period_id, from, to } = params
    const queryParams = new URLSearchParams()

    if (pay_period_id) queryParams.append('pay_period_id', pay_period_id.toString())
    if (from) queryParams.append('from', from)
    if (to) queryParams.append('to', to)

    const query = queryParams.toString()
    const url = `/savings/entries/user/${userId}${query ? `?${query}` : ''}`

    const data = await apiFetch<SavingEntry[]>(url)
    return z.array(SavingEntrySchema).parse(data)
  },

  /**
   * POST /api/savings/entries
   * Crea una nueva entrada de ahorro
   */
  async createEntry(input: CreateSavingEntryInput): Promise<CreateSavingEntryResponse> {
    const validated = CreateSavingEntryInputSchema.parse(input)
    const data = await apiFetch<CreateSavingEntryResponse>('/savings/entries', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return CreateSavingEntryResponseSchema.parse(data)
  },
}

// ============================================================
// PHASE 8: SAVING GOALS (Metas de ahorro)
// ============================================================

export const SavingGoalSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  target_amount_cents: z.number(),
  target_date: z.string().nullable(), // YYYY-MM-DD
  note: z.string().nullable().optional(),
  created_at: z.string().optional(),
  // Campos agregados (del JOIN):
  saved_cents: z.coerce.number().optional(),
  remaining_cents: z.coerce.number().optional(),
  assigned_entry_ids: z.string().nullable().optional(), // "1,2,3" formato CSV
})

export const CreateSavingGoalInputSchema = z.object({
  user_id: z.number(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  target_amount_cents: z.number().min(1, 'El monto objetivo debe ser mayor a 0'),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)').nullable().optional(),
  note: z.string().nullable().optional(),
})

export const CreateSavingGoalResponseSchema = z.object({
  id: z.number(),
})

// Allocations (asignaciones parciales de entries a goals)
export const AllocationSchema = z.object({
  goal_id: z.number(),
  goal_name: z.string(),
  amount_cents: z.coerce.number(),
})

export const EntryAllocationsSchema = z.object({
  entry_id: z.number(),
  entry_amount_cents: z.coerce.number(),
  total_allocated_cents: z.coerce.number(),
  unassigned_cents: z.coerce.number(),
  allocations: z.array(AllocationSchema),
})

export type Allocation = z.infer<typeof AllocationSchema>
export type EntryAllocations = z.infer<typeof EntryAllocationsSchema>

export type SavingGoal = z.infer<typeof SavingGoalSchema>
export type CreateSavingGoalInput = z.infer<typeof CreateSavingGoalInputSchema>
export type CreateSavingGoalResponse = z.infer<typeof CreateSavingGoalResponseSchema>

export const goalsApi = {
  /**
   * GET /api/savings/goals/user/:userId
   * Lista metas con progreso agregado
   */
  async listByUser(userId: number): Promise<SavingGoal[]> {
    const data = await apiFetch<SavingGoal[]>(`/savings/goals/user/${userId}`)
    return z.array(SavingGoalSchema).parse(data)
  },

  /**
   * POST /api/savings/goals
   * Crea una nueva meta de ahorro
   */
  async create(input: CreateSavingGoalInput): Promise<CreateSavingGoalResponse> {
    const validated = CreateSavingGoalInputSchema.parse(input)
    const data = await apiFetch<CreateSavingGoalResponse>('/savings/goals', {
      method: 'POST',
      body: JSON.stringify(validated),
    })
    return CreateSavingGoalResponseSchema.parse(data)
  },

  /**
   * POST /api/savings/goals/entries/:entryId/assign-goal/:goalId
   * Asigna una entrada de ahorro a una meta (con monto parcial opcional)
   */
  async assignEntryToGoal(entryId: number, goalId: number, amountCents?: number): Promise<{ linked: boolean }> {
    const body = amountCents !== undefined ? { amount_cents: amountCents } : undefined
    const data = await apiFetch<{ linked: boolean }>(
      `/savings/goals/entries/${entryId}/assign-goal/${goalId}`,
      {
        method: 'POST',
        ...(body ? { body: JSON.stringify(body) } : {}),
      }
    )
    return data
  },

  /**
   * DELETE /api/savings/goals/entries/:entryId/assign-goal/:goalId
   * Desvincula una entrada de ahorro de una meta
   */
  async unassignEntryFromGoal(entryId: number, goalId: number): Promise<{ unlinked: boolean; amount_cents_freed: number }> {
    const data = await apiFetch<{ unlinked: boolean; amount_cents_freed: number }>(
      `/savings/goals/entries/${entryId}/assign-goal/${goalId}`,
      {
        method: 'DELETE',
      }
    )
    return data
  },

  /**
   * GET /api/savings/goals/entries/:entryId/allocations
   * Ver asignaciones de un entry
   */
  async getEntryAllocations(entryId: number): Promise<EntryAllocations> {
    const data = await apiFetch<EntryAllocations>(
      `/savings/goals/entries/${entryId}/allocations`
    )
    return EntryAllocationsSchema.parse(data)
  },

  /**
   * DELETE /api/savings/goals/:id
   * Elimina una meta (opcional)
   */
  async delete(id: number): Promise<{ deleted: boolean }> {
    const data = await apiFetch<{ deleted: boolean }>(`/savings/goals/${id}`, {
      method: 'DELETE',
    })
    return data
  },
}

// ============================================================
// PHASE 9: SUMMARY (Resumen por quincena)
// ============================================================

export const PayPeriodSummarySchema = z.object({
  pay_period_id: z.number(),
  pay_date: z.string(), // YYYY-MM-DD
  gross_income_cents: z.number(),       // Sueldo de quincena
  additional_income_cents: z.number(),  // Ingresos extra (otros negocios)
  expenses_out_cents: z.number(),       // Gastos + transferencias
  savings_out_cents: z.number(),        // Ahorros
  reserved_planned_cents: z.number(),   // Pagos programados
  leftover_cents: z.number(),           // Disponible
})

export type PayPeriodSummary = z.infer<typeof PayPeriodSummarySchema>

export const summaryApi = {
  /**
   * GET /api/summary/pay-period/:id
   * Obtiene el resumen de una quincena específica
   */
  async getPayPeriodSummary(payPeriodId: number): Promise<PayPeriodSummary> {
    const data = await apiFetch<PayPeriodSummary>(`/summary/pay-period/${payPeriodId}`)
    return PayPeriodSummarySchema.parse(data)
  },
}

// ============================================================
// EXPORT ALL
// ============================================================

export { ApiError }
