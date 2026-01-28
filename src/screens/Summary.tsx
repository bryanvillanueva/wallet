import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { summaryApi, savingsApi, CreateSavingEntryInputSchema } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import { PayPeriodDetail } from '../components/PayPeriodDetail'
import type { PayPeriodSummary, PayPeriod } from '../lib/api'
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  BuildingLibraryIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'

export function Summary() {
  const { activeUserId } = useAuthStore()
  const { payPeriods, setPayPeriods, accounts, setAccounts } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [summaries, setSummaries] = useState<Map<number, PayPeriodSummary>>(new Map())
  const [error, setError] = useState<string | null>(null)

  // Modal "Guardar en Savings"
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [selectedLeftover, setSelectedLeftover] = useState<number>(0)

  // Modal detalle de quincena
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(CreateSavingEntryInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      account_id: 0,
      amount_cents: 0,
      entry_date: '',
      pay_period_id: null,
      note: '',
    },
  })

  useEffect(() => {
    if (activeUserId) {
      loadAllData()
    }
  }, [activeUserId])

  const loadAllData = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      // Cargar pay periods y accounts
      const [payPeriodsData, accountsData] = await Promise.all([
        fetch(`https://wallet-api-production-2e8a.up.railway.app/api/pay-periods/user/${activeUserId}`).then(r => r.json()),
        fetch(`https://wallet-api-production-2e8a.up.railway.app/api/accounts/user/${activeUserId}`).then(r => r.json()),
      ])

      setPayPeriods(payPeriodsData)
      setAccounts(accountsData)

      // Cargar summaries para cada pay period
      const summariesMap = new Map<number, PayPeriodSummary>()
      await Promise.all(
        payPeriodsData.map(async (pp: any) => {
          try {
            const summary = await summaryApi.getPayPeriodSummary(pp.id)
            summariesMap.set(pp.id, summary)
          } catch (err) {
            console.error(`Error loading summary for pay period ${pp.id}:`, err)
          }
        })
      )
      setSummaries(summariesMap)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSavingsModal = (payPeriodId: number, leftoverCents: number) => {
    setSelectedLeftover(leftoverCents)
    setShowSavingsModal(true)

    // Pre-llenar el formulario
    const payPeriod = payPeriods.find(pp => pp.id === payPeriodId)
    reset({
      user_id: activeUserId || 0,
      account_id: accounts.find(a => a.type === 'savings')?.id || accounts[0]?.id || 0,
      amount_cents: leftoverCents,
      entry_date: payPeriod?.pay_date || new Date().toISOString().split('T')[0],
      pay_period_id: payPeriodId,
      note: `Ahorro de quincena ${payPeriod?.pay_date || ''}`,
    })
  }

  const onCreateSavingEntry = async (data: any) => {
    try {
      setError(null)
      await savingsApi.createEntry({
        user_id: activeUserId!,
        account_id: data.account_id,
        amount_cents: data.amount_cents,
        entry_date: data.entry_date,
        pay_period_id: data.pay_period_id || null,
        note: data.note || null,
      })

      setShowSavingsModal(false)
      reset()
      // Recargar summaries para actualizar savings_out_cents
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar ahorro')
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

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <LoadingBar />
        </div>
      </div>
    )
  }

  // Si hay una quincena seleccionada, mostrar el detalle
  if (selectedPayPeriod) {
    return (
      <PayPeriodDetail
        payPeriod={selectedPayPeriod}
        onClose={() => setSelectedPayPeriod(null)}
      />
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-8">Resumen por Quincena</h1>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {payPeriods.length === 0 ? (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
            <p className="text-[17px] font-medium text-[#1a1a1a] dark:text-white mb-2">
              No hay quincenas registradas
            </p>
            <p className="text-[15px] text-[#666] dark:text-neutral-400">
              Registra tu primera quincena para ver el resumen financiero
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payPeriods.map((payPeriod) => {
              const summary = summaries.get(payPeriod.id)

              return (
                <div
                  key={payPeriod.id}
                  className="glass-card-light dark:glass-card-dark rounded-2xl p-6"
                >
                  {/* Encabezado - clickeable para ver detalle */}
                  <div
                    onClick={() => setSelectedPayPeriod(payPeriod)}
                    className="flex items-center justify-between mb-6 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <div>
                      <h2 className="text-[19px] font-bold text-[#1a1a1a] dark:text-white">
                        Quincena {formatDate(payPeriod.pay_date)}
                      </h2>
                      {payPeriod.note && (
                        <p className="text-[13px] text-[#666] dark:text-neutral-400 mt-1">
                          {payPeriod.note}
                        </p>
                      )}
                      <p className="text-[11px] text-[#22d3ee] dark:text-[#4da3ff] mt-1 font-medium">
                        Click para ver detalle completo
                      </p>
                    </div>
                    {payPeriod.gross_income_cents !== null && (
                      <div className="text-right">
                        <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-1">
                          Ingreso Bruto
                        </p>
                        <p className="text-[17px] font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(payPeriod.gross_income_cents)}
                        </p>
                      </div>
                    )}
                  </div>

                  {summary ? (
                    <>
                      {/* Métricas principales */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                        {/* Ingreso Bruto (Sueldo) */}
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BanknotesIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider">
                              Ingreso Bruto
                            </p>
                          </div>
                          <p className="text-[17px] font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(summary.gross_income_cents)}
                          </p>
                          <p className="text-[11px] text-[#888] dark:text-neutral-500 mt-1">
                            Sueldo de quincena
                          </p>
                        </div>

                        {/* Ingresos Adicionales */}
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CurrencyDollarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider">
                              Ing. Adicionales
                            </p>
                          </div>
                          <p className="text-[17px] font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(summary.additional_income_cents)}
                          </p>
                          <p className="text-[11px] text-[#888] dark:text-neutral-500 mt-1">
                            Otros negocios
                          </p>
                        </div>

                        {/* Gastos */}
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ArchiveBoxIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider">
                              Gastos
                            </p>
                          </div>
                          <p className="text-[17px] font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(Math.abs(summary.expenses_out_cents))}
                          </p>
                          <p className="text-[11px] text-[#888] dark:text-neutral-500 mt-1">
                            Gastos + transferencias
                          </p>
                        </div>

                        {/* Ahorros */}
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BuildingLibraryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider">
                              Ahorros
                            </p>
                          </div>
                          <p className="text-[17px] font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(summary.savings_out_cents)}
                          </p>
                        </div>

                        {/* Reservas */}
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardDocumentCheckIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider">
                              Reservas
                            </p>
                          </div>
                          <p className="text-[17px] font-bold text-orange-600 dark:text-orange-400">
                            {formatCurrency(summary.reserved_planned_cents)}
                          </p>
                          <p className="text-[11px] text-[#888] dark:text-neutral-500 mt-1">
                            Pagos programados
                          </p>
                        </div>

                        {/* Disponible */}
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4 bg-gradient-to-br from-[#22d3ee]/10 to-[#06b6d4]/10 dark:from-[#4da3ff]/10 dark:to-[#3b82f6]/10 border-2 border-[#22d3ee]/30 dark:border-[#4da3ff]/30">
                          <div className="flex items-center gap-2 mb-2">
                            <SparklesIcon className="w-5 h-5 text-[#22d3ee] dark:text-[#4da3ff]" />
                            <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider">
                              Disponible
                            </p>
                          </div>
                          <p className={`text-[19px] font-bold ${summary.leftover_cents >= 0
                            ? 'text-[#22d3ee] dark:text-[#4da3ff]'
                            : 'text-red-600 dark:text-red-400'
                            }`}>
                            {formatCurrency(summary.leftover_cents)}
                          </p>
                        </div>
                      </div>

                      {/* CTA "Guardar en Savings" */}
                      {summary.leftover_cents > 0 && (
                        <div className="glass-card-light dark:glass-card-dark rounded-xl p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white mb-1">
                                Tienes ${formatCurrency(summary.leftover_cents)} disponible
                              </p>
                              <p className="text-[13px] text-[#666] dark:text-neutral-400">
                                ¿Quieres guardar parte en ahorros?
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenSavingsModal(payPeriod.id, summary.leftover_cents)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl text-[15px] font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                            >
                              Guardar en Ahorros
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-[15px] text-[#666] dark:text-neutral-400">
                        No se pudo cargar el resumen de esta quincena
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal "Guardar en Savings" */}
        {showSavingsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-[19px] font-bold text-[#1a1a1a] dark:text-white mb-4">
                Guardar en Ahorros
              </h3>

              <form onSubmit={handleSubmit(onCreateSavingEntry)} className="space-y-4">
                {/* Cuenta */}
                <div>
                  <label htmlFor="account_id" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Cuenta de Ahorro
                  </label>
                  <select
                    id="account_id"
                    {...register('account_id', { valueAsNumber: true })}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  >
                    {accounts.map((account) => (
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

                {/* Monto */}
                <div>
                  <label htmlFor="amount_cents" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Monto a Ahorrar
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
                  <p className="mt-1 text-[11px] text-[#666] dark:text-neutral-500">
                    Disponible: {formatCurrency(selectedLeftover)}
                  </p>
                  {errors.amount_cents && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.amount_cents.message}
                    </p>
                  )}
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
                </div>

                {/* Nota */}
                <div>
                  <label htmlFor="note" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Nota (opcional)
                  </label>
                  <input
                    id="note"
                    type="text"
                    {...register('note')}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                    placeholder="Ej: Ahorro de quincena octubre"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSavingsModal(false)
                      reset()
                    }}
                    className="flex-1 px-4 py-3 glass-button rounded-2xl text-[15px] font-semibold text-[#555] dark:text-neutral-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-2xl text-[15px] font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
