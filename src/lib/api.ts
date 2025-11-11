import { z } from 'zod'

// Base URL configurable por entorno
const BASE_URL = import.meta.env.VITE_API_BASE ?? 'https://wallet-api-production-2e8a.up.railway.app/api'

// ============================================================
// UTILITY: Fetch wrapper con manejo de errores
// ============================================================

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
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
    errorMap: () => ({ message: 'Tipo de cuenta inválido' }),
  }),
  currency: z.string().length(3, 'La moneda debe tener 3 letras').default('AUD'),
  is_active: z.boolean().default(true),
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
// EXPORT ALL
// ============================================================

export { ApiError }
