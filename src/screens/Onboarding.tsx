import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateUserInputSchema, type CreateUserInput, usersApi, type User } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { LoadingBar } from '../components/LoadingBar'

export function Onboarding() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setActiveUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserInputSchema),
  })

  // Cargar usuarios existentes
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const data = await usersApi.list()
      setUsers(data)
    } catch (err) {
      console.error('Error loading users:', err)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateUser = async (data: CreateUserInput) => {
    try {
      setError(null)
      const response = await usersApi.create(data)
      setActiveUser(response.id, data.name)
      reset()
      setShowCreateForm(false)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario')
    }
  }

  const onSelectUser = (user: User) => {
    setActiveUser(user.id, user.name)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#dbeafe] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0c4a6e] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <LoadingBar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#dbeafe] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0c4a6e] p-6 flex flex-col items-center justify-center">
      {/* Logo/Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-2">Wallet App</h1>
        <p className="text-[15px] text-[#666666] dark:text-neutral-400">
          Gestiona tus finanzas de forma inteligente
        </p>
      </div>

      {/* Card principal */}
      <div className="w-full max-w-md glass-card-light dark:glass-card-dark rounded-3xl p-8">
        <h2 className="text-2xl font-semibold text-[#1a1a1a] dark:text-white mb-6">
          {users.length === 0 ? 'Crear tu usuario' : 'Selecciona tu usuario'}
        </h2>

        {/* Error global */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Lista de usuarios existentes */}
        {users.length > 0 && !showCreateForm && (
          <div className="space-y-3 mb-6">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onSelectUser(user.id)}
                className="w-full p-4 glass-button rounded-2xl text-left transition-all duration-300 ease-out hover:-translate-y-1"
              >
                <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white">{user.name}</p>
                {user.email && (
                  <p className="text-[13px] text-[#666666] dark:text-neutral-300 mt-1">{user.email}</p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Formulario de creación */}
        {(showCreateForm || users.length === 0) && (
          <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
            {/* Campo Nombre */}
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                placeholder="Tu nombre"
              />
              {errors.name && (
                <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Campo Email (opcional) */}
            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                Email (opcional)
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                placeholder="tu@email.com"
              />
              {errors.email && (
                <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              {users.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 glass-button rounded-2xl text-[15px] font-semibold text-[#555] dark:text-neutral-300"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.6)] dark:hover:shadow-[0_12px_40px_rgba(77,163,255,0.6)] transition-all duration-300 ease-out hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        )}

        {/* Botón "Crear otro usuario" */}
        {users.length > 0 && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full mt-4 px-4 py-3 glass-button rounded-2xl text-[15px] font-semibold text-[#22d3ee] dark:text-[#4da3ff]"
          >
            + Crear nuevo usuario
          </button>
        )}
      </div>
    </div>
  )
}
