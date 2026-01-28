import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSavingEntryInputSchema, savingsApi, payPeriodsApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import {
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export function Savings() {
  const { activeUserId } = useAuthStore()
  const { savingEntries, setSavingEntries, accounts, setAccounts, payPeriods, setPayPeriods } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filterPayPeriod, setFilterPayPeriod] = useState<number | null>(null)
  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')
  const [filterAccount, setFilterAccount] = useState<number | null>(null)

  type FormData = {
    user_id: number
    account_id: number
    amount_cents: number
    entry_date: string
    pay_period_id?: number | null
    note?: string | null
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(CreateSavingEntryInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      pay_period_id: null,
      note: '',
    },
  })

  useEffect(() => {
    if (activeUserId) {
      loadAllData()
    }
  }, [activeUserId])

  useEffect(() => {
    if (activeUserId) {
      loadSavingEntries()
    }
  }, [filterPayPeriod, filterFrom, filterTo, activeUserId])

  const loadAllData = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const [entriesData, accountsData, payPeriodsData] = await Promise.all([
        savingsApi.listEntries({ userId: activeUserId }),
        fetch(`https://wallet-api-production-2e8a.up.railway.app/api/accounts/user/${activeUserId}`).then(r => r.json()),
        payPeriodsApi.listByUser(activeUserId),
      ])
      setSavingEntries(entriesData)
      setAccounts(accountsData)
      setPayPeriods(payPeriodsData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavingEntries = async () => {
    if (!activeUserId) return

    try {
      const data = await savingsApi.listEntries({
        userId: activeUserId,
        pay_period_id: filterPayPeriod || undefined,
        from: filterFrom || undefined,
        to: filterTo || undefined,
      })
      setSavingEntries(data)
    } catch (err) {
      console.error('Error loading saving entries:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar ahorros')
    }
  }

  const onCreateEntry = async (data: FormData) => {
    try {
      setError(null)
      await savingsApi.createEntry({
        user_id: activeUserId!,
        account_id: data.account_id,
        amount_cents: data.amount_cents,
        entry_date: data.entry_date,
        pay_period_id: data.pay_period_id,
        note: data.note,
      })

      await loadSavingEntries()
      reset({
        user_id: activeUserId || 0,
        pay_period_id: null,
        note: '',
      })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear aporte')
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

    const dateToFormat = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const date = new Date(dateToFormat)

    if (isNaN(date.getTime())) return 'Fecha inválida'

    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getAccountName = (accountId: number) => {
    const account = accounts.find((a) => a.id === accountId)
    return account ? account.name : `Cuenta #${accountId}`
  }



  // Calcular Total Saved (suma de todos los amount_cents)
  const totalSaved = savingEntries.reduce((sum, entry) => sum + entry.amount_cents, 0)

  // Filtrar entradas por cuenta si se seleccionó un filtro
  const filteredEntries = filterAccount
    ? savingEntries.filter((e) => e.account_id === filterAccount)
    : savingEntries

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
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Hola de nuevo</p>
            <h1 className="text-2xl font-bold text-[#1a1a1a] dark:text-white">Ahorros</h1>
          </div>
        </div>



        <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 mb-6">
          <div className="text-center">
            <p className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-2">
              Total Ahorrado
            </p>
            <p className={`text-4xl font-bold ${totalSaved >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
              }`}>
              {formatCurrency(totalSaved)}
            </p>
          </div>
        </div>

        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.6)] dark:hover:shadow-[0_12px_40px_rgba(77,163,255,0.6)] transition-all duration-300 ease-out hover:-translate-y-1"
          >
            <PlusIcon className="w-5 h-5" /> Nuevo Aporte/Retiro
          </button>
        )}

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
              Nuevo Aporte/Retiro
            </h3>

            <form onSubmit={handleSubmit(onCreateEntry)} className="space-y-4">
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
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                {errors.account_id && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.account_id.message}
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
                      setValueAs: (v) => (v === '' || v === null ? 0 : Math.round(parseFloat(v) * 100)),
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
                  Positivo para depósito, negativo para retiro (ej: 500.00 o -200.00)
                </p>
              </div>

              {/* Fecha */}
              <div>
                <label htmlFor="entry_date" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Fecha
                </label>
                <input
                  id="entry_date"
                  type="date"
                  {...register('entry_date')}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                />
                {errors.entry_date && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.entry_date.message}
                  </p>
                )}
              </div>

              {/* Quincena (opcional) */}
              <div>
                <label htmlFor="pay_period_id" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Quincena (opcional)
                </label>
                <select
                  id="pay_period_id"
                  {...register('pay_period_id', {
                    setValueAs: (v) => (v === '' || v === null ? null : parseInt(v)),
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

              {/* Nota (opcional) */}
              <div>
                <label htmlFor="note" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Nota (opcional)
                </label>
                <textarea
                  id="note"
                  {...register('note')}
                  rows={2}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300 resize-none"
                  placeholder="Ej: Ahorro para vacaciones"
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
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filtros */}
        <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4 mb-6">
          <p className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-3">
            Filtros
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Quincena */}
            <select
              value={filterPayPeriod || ''}
              onChange={(e) => setFilterPayPeriod(e.target.value ? parseInt(e.target.value) : null)}
              className="glass-input px-4 py-2 rounded-2xl text-[#1a1a1a] dark:text-white text-[13px] focus:outline-none"
            >
              <option value="">Todas las quincenas</option>
              {payPeriods.map((pp) => (
                <option key={pp.id} value={pp.id}>
                  {formatDate(pp.pay_date)}
                </option>
              ))}
            </select>

            {/* Desde */}
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              placeholder="Desde"
              className="glass-input px-4 py-2 rounded-2xl text-[#1a1a1a] dark:text-white text-[13px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none"
            />

            {/* Hasta */}
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              placeholder="Hasta"
              className="glass-input px-4 py-2 rounded-2xl text-[#1a1a1a] dark:text-white text-[13px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none"
            />

            {/* Cuenta */}
            <select
              value={filterAccount || ''}
              onChange={(e) => setFilterAccount(e.target.value ? parseInt(e.target.value) : null)}
              className="glass-input px-4 py-2 rounded-2xl text-[#1a1a1a] dark:text-white text-[13px] focus:outline-none"
            >
              <option value="">Todas las cuentas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Limpiar filtros */}
          {(filterPayPeriod || filterFrom || filterTo || filterAccount) && (
            <button
              onClick={() => {
                setFilterPayPeriod(null)
                setFilterFrom('')
                setFilterTo('')
                setFilterAccount(null)
              }}
              className="mt-3 w-full px-3 py-2 glass-button rounded-2xl text-[13px] font-semibold text-[#666] dark:text-neutral-300"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Lista de entradas */}
        {filteredEntries.length === 0 ? (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
            <p className="text-[17px] font-medium text-[#1a1a1a] dark:text-white mb-2">
              No hay movimientos de ahorro
            </p>
            <p className="text-[15px] text-[#666] dark:text-neutral-400 mb-4">
              Registra tu primer aporte para comenzar a ahorrar
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]"
              >
                Registrar Primer Aporte
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => {
              const isDeposit = entry.amount_cents > 0
              return (
                <div
                  key={entry.id}
                  className="glass-card-light dark:glass-card-dark rounded-2xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">
                          {isDeposit ? <ArrowUpTrayIcon className="w-6 h-6 text-green-500" /> : <ArrowDownTrayIcon className="w-6 h-6 text-red-500" />}
                        </span>
                        <div>
                          <p className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">
                            {isDeposit ? 'Depósito' : 'Retiro'}
                          </p>
                          <p className="text-[13px] text-[#666] dark:text-neutral-400">
                            {formatDate(entry.entry_date)} · {getAccountName(entry.account_id)}
                          </p>
                        </div>
                      </div>

                      {entry.note && (
                        <p className="text-[15px] text-[#666] dark:text-neutral-300 mt-2 ml-11">
                          {entry.note}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className={`text-[19px] font-bold ${isDeposit
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                        }`}>
                        {isDeposit ? '+' : ''}{formatCurrency(entry.amount_cents)}
                      </p>
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
