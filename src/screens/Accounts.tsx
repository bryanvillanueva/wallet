import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateAccountInputSchema,
  type CreateAccountInput,
  type Account,
  accountsApi,
} from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'bank', label: 'Banco', icon: '🏦' },
  { value: 'credit', label: 'Crédito', icon: '💳' },
  { value: 'savings', label: 'Ahorros', icon: '🐷' },
] as const

export function Accounts() {
  const { activeUserId } = useAuthStore()
  const { accounts, setAccounts, addAccount, updateAccount } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateAccountInput>({
    resolver: zodResolver(CreateAccountInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      currency: 'AUD',
      is_active: true,
    },
  })

  useEffect(() => {
    if (activeUserId) {
      loadAccounts()
    }
  }, [activeUserId])

  const loadAccounts = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const data = await accountsApi.listByUser(activeUserId)
      setAccounts(data)
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError('Error al cargar las cuentas')
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateAccount = async (data: CreateAccountInput) => {
    try {
      setError(null)
      const response = await accountsApi.create({
        ...data,
        user_id: activeUserId!,
      })

      // Recargar cuentas después de crear
      await loadAccounts()

      reset()
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cuenta')
    }
  }

  const toggleAccountStatus = async (account: Account) => {
    try {
      await accountsApi.update(account.id, {
        is_active: !account.is_active,
      })

      updateAccount(account.id, { is_active: !account.is_active })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar cuenta')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <LoadingBar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-2">
            Cuentas
          </h1>
          <p className="text-[15px] text-[#666] dark:text-neutral-400">
            Gestiona tus cuentas de efectivo, banco, crédito y ahorros
          </p>
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Lista de cuentas */}
        {accounts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="glass-card-light dark:glass-card-dark rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {
                        ACCOUNT_TYPES.find((t) => t.value === account.type)
                          ?.icon
                      }
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">
                        {account.name}
                      </h3>
                      <p className="text-[13px] text-[#666] dark:text-neutral-400 mt-1">
                        {
                          ACCOUNT_TYPES.find((t) => t.value === account.type)
                            ?.label
                        }{' '}
                        · {account.currency}
                      </p>
                    </div>
                  </div>

                  {/* Toggle activo/inactivo */}
                  <button
                    onClick={() => toggleAccountStatus(account)}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      account.is_active
                        ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6]'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                        account.is_active ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      account.is_active
                        ? 'bg-green-500'
                        : 'bg-gray-400 dark:bg-gray-600'
                    }`}
                  />
                  <span className="text-[13px] text-[#666] dark:text-neutral-400">
                    {account.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {accounts.length === 0 && !showCreateForm && (
          <div className="glass-card-light dark:glass-card-dark rounded-3xl p-12 text-center mb-6">
            <div className="text-6xl mb-4">🏦</div>
            <h3 className="text-xl font-semibold text-[#1a1a1a] dark:text-white mb-2">
              No tienes cuentas
            </h3>
            <p className="text-[15px] text-[#666] dark:text-neutral-400">
              Crea tu primera cuenta para comenzar a gestionar tus finanzas
            </p>
          </div>
        )}

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="glass-card-light dark:glass-card-dark rounded-3xl p-8 mb-6">
            <h2 className="text-2xl font-semibold text-[#1a1a1a] dark:text-white mb-6">
              Nueva cuenta
            </h2>

            <form onSubmit={handleSubmit(onCreateAccount)} className="space-y-4">
              {/* Nombre */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2"
                >
                  Nombre de la cuenta
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                  placeholder="Ej: Cuenta corriente, Tarjeta Visa..."
                />
                {errors.name && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Tipo de cuenta */}
              <div>
                <label className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Tipo de cuenta
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ACCOUNT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="glass-button rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex items-center gap-3"
                    >
                      <input
                        type="radio"
                        value={type.value}
                        {...register('type')}
                        className="sr-only"
                      />
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-[15px] font-medium text-[#1a1a1a] dark:text-white">
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.type.message}
                  </p>
                )}
              </div>

              {/* Moneda */}
              <div>
                <label
                  htmlFor="currency"
                  className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2"
                >
                  Moneda
                </label>
                <input
                  id="currency"
                  type="text"
                  {...register('currency')}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                  placeholder="AUD"
                  maxLength={3}
                />
                {errors.currency && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.currency.message}
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    reset()
                  }}
                  className="flex-1 px-4 py-3 glass-button rounded-2xl text-[15px] font-semibold text-[#555] dark:text-neutral-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.6)] dark:hover:shadow-[0_12px_40px_rgba(77,163,255,0.6)] transition-all duration-300 ease-out hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear cuenta'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Botón para mostrar formulario */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full px-4 py-3 glass-button rounded-2xl text-[15px] font-semibold text-[#22d3ee] dark:text-[#4da3ff] transition-all duration-300 hover:-translate-y-1"
          >
            + Nueva cuenta
          </button>
        )}
      </div>
    </div>
  )
}
