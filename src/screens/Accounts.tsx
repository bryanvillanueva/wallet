import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateAccountInputSchema,
  type Account,
  accountsApi,
} from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import {
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'

const ACCOUNT_TYPES: Array<{
  value: 'cash' | 'bank' | 'credit' | 'savings'
  label: string
  Icon: React.ElementType
  color: string
  bg: string
}> = [
  { value: 'cash', label: 'Efectivo', Icon: BanknotesIcon, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'bank', label: 'Banco', Icon: BuildingLibraryIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'credit', label: 'Credito', Icon: CreditCardIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'savings', label: 'Ahorros', Icon: BuildingStorefrontIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
]

export function Accounts() {
  const { activeUserId } = useAuthStore()
  const { accounts, setAccounts, updateAccount } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  type FormData = {
    user_id: number
    name: string
    type: 'cash' | 'bank' | 'credit' | 'savings'
    currency?: string
    is_active?: boolean
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(CreateAccountInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      currency: 'AUD',
      is_active: true,
    },
  })

  const selectedType = watch('type')

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

  const onCreateAccount = async (data: FormData) => {
    try {
      setError(null)
      await accountsApi.create({
        user_id: activeUserId!,
        name: data.name,
        type: data.type,
        currency: data.currency || 'AUD',
        is_active: data.is_active ?? true,
      })

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

  const getAccountTypeInfo = (type: string) => {
    return ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0]
  }

  const activeCount = accounts.filter((a) => a.is_active).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="bg-gradient-to-br from-[#d821f9] to-[#a018c0] px-6 pt-12 pb-24 rounded-b-[32px]" />
        <div className="px-5 -mt-16">
          <LoadingBar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ============ HEADER PURPLE ============ */}
      <div className="bg-gradient-to-br from-[#d821f9] to-[#a018c0] px-6 pt-8 pb-28 rounded-b-[32px]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm font-semibold mb-1">Gestion financiera</p>
              <h1 className="text-white text-2xl font-extrabold">Cuentas</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
            >
              <PlusIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Total cuentas
              </p>
              <p className="text-white text-2xl font-black">
                {accounts.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Activas
              </p>
              <p className="text-white text-2xl font-black">
                {activeCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-lg mx-auto px-5 -mt-16 pb-8">
        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <XMarkIcon
              className="w-5 h-5 text-red-400 cursor-pointer shrink-0 mt-0.5"
              onClick={() => setError(null)}
            />
            <p className="text-sm text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {/* Lista de cuentas */}
        {accounts.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <BuildingLibraryIcon className="w-7 h-7 text-[#d821f9]" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">
              No tienes cuentas
            </p>
            <p className="text-sm text-gray-400 mb-5">
              Crea tu primera cuenta para comenzar
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 fintech-btn-primary text-sm"
            >
              Crear Primera Cuenta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {accounts.map((account) => {
              const typeInfo = getAccountTypeInfo(account.type)
              return (
                <div
                  key={account.id}
                  className="fintech-card p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${typeInfo.bg} flex items-center justify-center`}>
                        <typeInfo.Icon className={`w-6 h-6 ${typeInfo.color}`} />
                      </div>
                      <div>
                        <p className="text-[15px] font-bold text-gray-800">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          {typeInfo.label} · {account.currency}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAccountStatus(account)}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        account.is_active
                          ? 'bg-gradient-to-r from-[#d821f9] to-[#a018c0]'
                          : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${
                          account.is_active ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${account.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-xs text-gray-400 font-semibold">
                      {account.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ============ MODAL NUEVA CUENTA ============ */}
      {showCreateForm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center"
          onClick={() => {
            setShowCreateForm(false)
            reset()
          }}
        >
          <div
            className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <BuildingLibraryIcon className="w-5 h-5 text-[#d821f9]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800">Nueva Cuenta</h3>
                    <p className="text-xs text-gray-400 font-semibold">Agregar cuenta financiera</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    reset()
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onCreateAccount)} className="px-5 py-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nombre de la cuenta
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                  placeholder="Ej: Cuenta corriente, Tarjeta Visa..."
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.name.message}</p>
                )}
              </div>

              {/* Tipo de cuenta */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tipo de cuenta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedType === type.value
                          ? 'border-[#d821f9] bg-purple-50/50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        {...register('type')}
                        className="sr-only"
                      />
                      <type.Icon className={`w-5 h-5 ${
                        selectedType === type.value ? 'text-[#d821f9]' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-semibold ${
                        selectedType === type.value ? 'text-[#d821f9]' : 'text-gray-600'
                      }`}>
                        {type.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.type && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.type.message}</p>
                )}
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Moneda
                </label>
                <input
                  type="text"
                  {...register('currency')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                  placeholder="AUD"
                  maxLength={3}
                />
                {errors.currency && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.currency.message}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    reset()
                  }}
                  className="flex-1 px-4 py-3 fintech-btn-secondary text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 fintech-btn-primary text-sm"
                >
                  {isSubmitting ? 'Creando...' : 'Crear cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
