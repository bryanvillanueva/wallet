import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateTransactionInputSchema,
  transactionsApi,
  categoriesApi,
  accountsApi,
  payPeriodsApi,
  type ListTransactionsParams,
} from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'

import {
  BanknotesIcon,
  ArrowPathIcon, // Transfer
  ScaleIcon, // Adjustment
  ArrowDownCircleIcon // Expense
} from '@heroicons/react/24/outline'

const TRANSACTION_TYPES: Array<{
  value: 'income' | 'expense' | 'transfer' | 'adjustment'
  label: string
  Icon: React.ElementType
  color: string
}> = [
    { value: 'income', label: 'Ingreso', Icon: BanknotesIcon, color: 'text-green-600 dark:text-green-400' },
    { value: 'expense', label: 'Gasto', Icon: ArrowDownCircleIcon, color: 'text-red-600 dark:text-red-400' },
    { value: 'transfer', label: 'Transferencia', Icon: ArrowPathIcon, color: 'text-blue-600 dark:text-blue-400' },
    { value: 'adjustment', label: 'Ajuste', Icon: ScaleIcon, color: 'text-yellow-600 dark:text-yellow-400' },
  ]

export function Transactions() {
  const { activeUserId } = useAuthStore()
  const {
    transactions,
    setTransactions,
    accounts,
    setAccounts,
    categories,
    setCategories,
    payPeriods,
    setPayPeriods,
  } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filterPayPeriod, setFilterPayPeriod] = useState<number | undefined>(undefined)
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  type FormData = {
    user_id: number
    pay_period_id?: number | null
    account_id: number
    category_id?: number | null
    type: 'income' | 'expense' | 'transfer' | 'adjustment'
    amount_cents: number
    description?: string | null
    txn_date: string
    planned_payment_id?: number | null
    counterparty_user_id?: number | null
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(CreateTransactionInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      pay_period_id: null,
      category_id: null,
      type: 'expense',
      txn_date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedType = watch('type')

  // Cargar datos relacionados (categorías, cuentas, quincenas) cuando cambia el usuario
  useEffect(() => {
    if (activeUserId) {
      loadRelatedData()
    }
  }, [activeUserId])

  // Cargar transacciones cuando cambian los filtros
  useEffect(() => {
    if (activeUserId) {
      loadTransactions()
    }
  }, [activeUserId, filterPayPeriod, filterDateFrom, filterDateTo])

  const loadRelatedData = async () => {
    if (!activeUserId) return

    try {
      const [categoriesData, accountsData, payPeriodsData] = await Promise.all([
        categoriesApi.list(activeUserId),
        accountsApi.listByUser(activeUserId),
        payPeriodsApi.listByUser(activeUserId),
      ])
      setCategories(categoriesData)
      setAccounts(accountsData)
      setPayPeriods(payPeriodsData)
    } catch (err) {
      console.error('Error loading related data:', err)
    }
  }

  const loadTransactions = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const params: ListTransactionsParams = {
        userId: activeUserId,
      }

      if (filterPayPeriod) params.pay_period_id = filterPayPeriod
      if (filterDateFrom) params.from = filterDateFrom
      if (filterDateTo) params.to = filterDateTo

      const data = await transactionsApi.list(params)
      setTransactions(data)
    } catch (err) {
      console.error('Error loading transactions:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones')
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateTransaction = async (data: FormData) => {
    try {
      setError(null)

      // Validar signo según tipo
      let amountCents = data.amount_cents
      if (data.type === 'expense' || data.type === 'transfer') {
        amountCents = Math.abs(amountCents) * -1 // Asegurar negativo
      } else {
        amountCents = Math.abs(amountCents) // Asegurar positivo
      }

      await transactionsApi.create({
        user_id: activeUserId!,
        pay_period_id: data.pay_period_id,
        account_id: data.account_id,
        category_id: data.category_id,
        type: data.type,
        amount_cents: amountCents,
        description: data.description,
        txn_date: data.txn_date,
        planned_payment_id: data.planned_payment_id,
        counterparty_user_id: data.counterparty_user_id,
      })

      await loadTransactions()
      reset({
        user_id: activeUserId || 0,
        pay_period_id: null,
        category_id: null,
        type: 'expense',
        txn_date: new Date().toISOString().split('T')[0],
      })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear transacción')
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta transacción?')) return

    try {
      await transactionsApi.delete(id)
      await loadTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar transacción')
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(cents / 100)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha no disponible'

    // Si la fecha ya incluye la hora, usarla directamente; si no, agregar T00:00:00
    const dateToFormat = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const date = new Date(dateToFormat)

    if (isNaN(date.getTime())) return 'Fecha inválida'

    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getTransactionTypeInfo = (type: string) => {
    return TRANSACTION_TYPES.find((t) => t.value === type) || TRANSACTION_TYPES[0]
  }

  const getAccountName = (accountId: number) => {
    return accounts.find((a) => a.id === accountId)?.name || `Cuenta #${accountId}`
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Sin categoría'
    return categories.find((c) => c.id === categoryId)?.name || `Categoría #${categoryId}`
  }

  // Filtrar categorías según el tipo de transacción seleccionado
  const filteredCategories = categories.filter((c) => c.kind === selectedType)

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <LoadingBar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white">Transacciones</h1>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 glass-button rounded-2xl text-[13px] font-semibold text-[#22d3ee] dark:text-[#4da3ff]"
            >
              + Nueva Transacción
            </button>
          )}
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 mb-6">
            <h3 className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white mb-4">
              Nueva Transacción
            </h3>

            <form onSubmit={handleSubmit(onCreateTransaction)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <label htmlFor="type" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Tipo
                  </label>
                  <select
                    id="type"
                    {...register('type')}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  >
                    {TRANSACTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.type.message}
                    </p>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label htmlFor="txn_date" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Fecha
                  </label>
                  <input
                    id="txn_date"
                    type="date"
                    {...register('txn_date')}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  />
                  {errors.txn_date && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.txn_date.message}
                    </p>
                  )}
                </div>

                {/* Cuenta */}
                <div>
                  <label htmlFor="account_id" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Cuenta
                  </label>
                  <select
                    id="account_id"
                    {...register('account_id', { valueAsNumber: true })}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  >
                    <option value="">Selecciona una cuenta</option>
                    {accounts.filter((a) => a.is_active).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  {errors.account_id && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.account_id.message}
                    </p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label htmlFor="category_id" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Categoría (opcional)
                  </label>
                  <select
                    id="category_id"
                    {...register('category_id', {
                      setValueAs: (v) => (v === '' ? null : Number(v)),
                    })}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  >
                    <option value="">Sin categoría</option>
                    {filteredCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.category_id.message}
                    </p>
                  )}
                </div>

                {/* Monto */}
                <div>
                  <label htmlFor="amount_cents" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Monto
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] dark:text-neutral-400 text-[15px]">
                      $
                    </span>
                    <input
                      id="amount_cents"
                      type="number"
                      step="0.01"
                      {...register('amount_cents', {
                        setValueAs: (v) => Math.round(parseFloat(v) * 100),
                      })}
                      className="glass-input w-full pl-8 pr-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount_cents && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.amount_cents.message}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-[#666] dark:text-neutral-500">
                    Ingresa el monto en dólares (ej: 25.50)
                  </p>
                </div>

                {/* Quincena (opcional) */}
                <div>
                  <label htmlFor="pay_period_id" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Quincena (opcional)
                  </label>
                  <select
                    id="pay_period_id"
                    {...register('pay_period_id', {
                      setValueAs: (v) => (v === '' ? null : Number(v)),
                    })}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  >
                    <option value="">Sin quincena</option>
                    {payPeriods.map((pp) => (
                      <option key={pp.id} value={pp.id}>
                        {formatDate(pp.pay_date)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="description" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  {...register('description')}
                  rows={2}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300 resize-none"
                  placeholder="Ej: Compra en supermercado"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
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
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        {!showCreateForm && (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4 mb-6">
            <p className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-3">
              Filtros
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label htmlFor="filter_pay_period" className="block text-[11px] text-[#666] dark:text-neutral-400 mb-1">
                  Quincena
                </label>
                <select
                  id="filter_pay_period"
                  value={filterPayPeriod || ''}
                  onChange={(e) => setFilterPayPeriod(e.target.value ? Number(e.target.value) : undefined)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-[#1a1a1a] dark:text-white text-[13px] focus:outline-none"
                >
                  <option value="">Todas</option>
                  {payPeriods.map((pp) => (
                    <option key={pp.id} value={pp.id}>
                      {formatDate(pp.pay_date)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter_from" className="block text-[11px] text-[#666] dark:text-neutral-400 mb-1">
                  Desde
                </label>
                <input
                  id="filter_from"
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-[#1a1a1a] dark:text-white text-[13px] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="filter_to" className="block text-[11px] text-[#666] dark:text-neutral-400 mb-1">
                  Hasta
                </label>
                <input
                  id="filter_to"
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-xl text-[#1a1a1a] dark:text-white text-[13px] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lista de transacciones */}
        {transactions.length === 0 ? (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
            <p className="text-[17px] font-medium text-[#1a1a1a] dark:text-white mb-2">
              No hay transacciones
            </p>
            <p className="text-[15px] text-[#666] dark:text-neutral-400 mb-4">
              Registra tu primera transacción para comenzar
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]"
              >
                Registrar Primera Transacción
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => {
              const typeInfo = getTransactionTypeInfo(txn.type)
              const isPositive = txn.amount_cents >= 0

              return (
                <div
                  key={txn.id}
                  className="glass-card-light dark:glass-card-dark rounded-2xl p-4 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="text-2xl">
                        <typeInfo.Icon className={`w-6 h-6 ${typeInfo.color.split(' ')[0]}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white">
                            {txn.description || getCategoryName(txn.category_id)}
                          </p>
                          <span className={`text-[11px] font-medium ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#666] dark:text-neutral-400">
                          <span>{formatDate(txn.txn_date)}</span>
                          <span>•</span>
                          <span>{getAccountName(txn.account_id)}</span>
                          {txn.category_id && (
                            <>
                              <span>•</span>
                              <span>{getCategoryName(txn.category_id)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className={`text-[17px] font-bold ${isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {isPositive ? '+' : ''}{formatCurrency(txn.amount_cents)}
                      </p>
                      <button
                        onClick={() => handleDeleteTransaction(txn.id)}
                        className="p-2 hover:bg-red-500/20 rounded-xl transition-all duration-200"
                        title="Eliminar"
                      >
                        <svg
                          className="w-4 h-4 text-red-600 dark:text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
