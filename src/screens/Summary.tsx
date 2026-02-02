import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { summaryApi, savingsApi, goalsApi, payPeriodsApi, accountsApi, CreateSavingEntryInputSchema } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import { PayPeriodDetail } from '../components/PayPeriodDetail'
import { Icons } from '../components/Icons'
import type { PayPeriodSummary, PayPeriod } from '../lib/api'
import {
  XMarkIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export function Summary() {
  const { activeUserId } = useAuthStore()
  const { payPeriods, setPayPeriods, accounts, setAccounts, savingGoals, setSavingGoals } = useWalletStore()
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
      goal_id: null as number | null,
      goal_amount_cents: null as number | null,
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
      const [payPeriodsData, accountsData, goalsData] = await Promise.all([
        payPeriodsApi.listByUser(activeUserId),
        accountsApi.listByUser(activeUserId),
        goalsApi.listByUser(activeUserId),
      ])

      setPayPeriods(payPeriodsData)
      setAccounts(accountsData)
      setSavingGoals(goalsData)

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

    const payPeriod = payPeriods.find(pp => pp.id === payPeriodId)
    reset({
      user_id: activeUserId || 0,
      account_id: accounts.find(a => a.type === 'savings')?.id || accounts[0]?.id || 0,
      amount_cents: leftoverCents,
      entry_date: payPeriod?.pay_date || new Date().toISOString().split('T')[0],
      pay_period_id: payPeriodId,
      note: `Ahorro de quincena ${payPeriod?.pay_date || ''}`,
      goal_id: null,
      goal_amount_cents: null,
    })
  }

  const onCreateSavingEntry = async (data: any) => {
    try {
      setError(null)
      const goalId = data.goal_id ? Number(data.goal_id) : null
      await savingsApi.createEntry({
        user_id: activeUserId!,
        account_id: data.account_id,
        amount_cents: data.amount_cents,
        entry_date: data.entry_date,
        pay_period_id: data.pay_period_id || null,
        note: data.note || null,
        goal_id: goalId,
        goal_amount_cents: goalId ? data.amount_cents : null,
      })

      setShowSavingsModal(false)
      reset()
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
    if (isNaN(date.getTime())) return 'Fecha invalida'
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  // Totales generales
  const allSummaries = Array.from(summaries.values())
  const totalGrossIncome = allSummaries.reduce((s, v) => s + v.gross_income_cents, 0)
  const totalAdditionalIncome = allSummaries.reduce((s, v) => s + v.additional_income_cents, 0)
  const totalExpenses = allSummaries.reduce((s, v) => s + Math.abs(v.expenses_out_cents), 0)
  const totalSavings = allSummaries.reduce((s, v) => s + v.savings_out_cents, 0)

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
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ============ HEADER PURPLE ============ */}
      <div className="bg-gradient-to-br from-[#d821f9] to-[#a018c0] px-6 pt-8 pb-28 rounded-b-[32px]">
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-sm font-semibold mb-1">Vision general</p>
          <h1 className="text-white text-2xl font-extrabold mb-6">Resumen</h1>

          {/* Totales YTD */}
          {allSummaries.length > 0 && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Ingresos YTD
                </p>
                <p className="text-white text-2xl font-black">
                  {formatCurrency(totalGrossIncome + totalAdditionalIncome)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Gastos YTD
                </p>
                <p className="text-white text-2xl font-black">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-lg mx-auto px-5 -mt-16 pb-8">
        {/* Mini cards de totales */}
        {allSummaries.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="fintech-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Icons.PiggyBank className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">Ahorros</p>
                <p className="text-[16px] font-extrabold text-gray-800">{formatCurrency(totalSavings)}</p>
              </div>
            </div>
            <div className="fintech-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Icons.Calendar className="w-5 h-5 text-[#d821f9]" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">Quincenas</p>
                <p className="text-[16px] font-extrabold text-gray-800">{payPeriods.length}</p>
              </div>
            </div>
          </div>
        )}

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

        {/* Lista de quincenas */}
        <h2 className="text-base font-extrabold text-gray-800 mb-3">Por Quincena</h2>

        {payPeriods.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Icons.Calendar className="w-8 h-8 text-[#d821f9]" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">Sin quincenas registradas</p>
            <p className="text-sm text-gray-400">
              Registra tu primera quincena para ver el resumen financiero
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payPeriods.map((payPeriod) => {
              const summary = summaries.get(payPeriod.id)
              const totalIncome = summary
                ? summary.gross_income_cents + summary.additional_income_cents
                : payPeriod.gross_income_cents || 0
              const expenses = summary ? Math.abs(summary.expenses_out_cents) : 0
              const leftover = summary ? summary.leftover_cents : 0

              return (
                <div key={payPeriod.id} className="fintech-card overflow-hidden">
                  {/* Header clickeable */}
                  <button
                    onClick={() => setSelectedPayPeriod(payPeriod)}
                    className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                      <Icons.Calendar className="w-5 h-5 text-[#d821f9]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-extrabold text-gray-800">
                        Quincena {formatDate(payPeriod.pay_date)}
                      </p>
                      {payPeriod.note && (
                        <p className="text-xs text-gray-400 font-medium truncate">{payPeriod.note}</p>
                      )}
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
                  </button>

                  {/* Metricas */}
                  {summary ? (
                    <div className="px-5 pb-5">
                      {/* Grid de metricas */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-green-50/60 rounded-xl p-3">
                          <p className="text-[10px] text-green-600/60 font-bold uppercase mb-0.5">Ingresos</p>
                          <p className="text-[14px] font-extrabold text-green-600">{formatCurrency(totalIncome)}</p>
                        </div>
                        <div className="bg-red-50/60 rounded-xl p-3">
                          <p className="text-[10px] text-red-500/60 font-bold uppercase mb-0.5">Gastos</p>
                          <p className="text-[14px] font-extrabold text-red-500">{formatCurrency(expenses)}</p>
                        </div>
                        <div className="bg-blue-50/60 rounded-xl p-3">
                          <p className="text-[10px] text-blue-500/60 font-bold uppercase mb-0.5">Ahorros</p>
                          <p className="text-[14px] font-extrabold text-blue-500">{formatCurrency(summary.savings_out_cents)}</p>
                        </div>
                      </div>

                      {/* Disponible + CTA */}
                      <div className={`rounded-xl p-3 flex items-center justify-between ${
                        leftover > 0 ? 'bg-purple-50 border border-[#d821f9]/20' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-2">
                          <SparklesIcon className={`w-4 h-4 ${leftover > 0 ? 'text-[#d821f9]' : 'text-gray-400'}`} />
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">Disponible</p>
                            <p className={`text-[15px] font-extrabold ${
                              leftover >= 0 ? 'text-[#d821f9]' : 'text-red-500'
                            }`}>
                              {formatCurrency(leftover)}
                            </p>
                          </div>
                        </div>
                        {leftover > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenSavingsModal(payPeriod.id, summary.leftover_cents)
                            }}
                            className="px-3 py-1.5 fintech-btn-primary text-xs"
                          >
                            Ahorrar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="px-5 pb-5">
                      <p className="text-xs text-gray-400 font-semibold">No se pudo cargar el resumen</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ============ MODAL GUARDAR EN SAVINGS ============ */}
        {showSavingsModal && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center"
            onClick={() => {
              setShowSavingsModal(false)
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
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                      <Icons.PiggyBank className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-800">Guardar en Ahorros</h3>
                      <p className="text-xs text-gray-400 font-semibold">
                        Disponible: {formatCurrency(selectedLeftover)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowSavingsModal(false)
                      reset()
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit(onCreateSavingEntry)} className="px-5 py-4 space-y-4">
                {/* Cuenta */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Cuenta de Ahorro
                  </label>
                  <select
                    {...register('account_id', { valueAsNumber: true })}
                    className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  {errors.account_id && (
                    <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.account_id.message}</p>
                  )}
                </div>

                {/* Meta de ahorro (opcional) */}
                {savingGoals.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Meta de Ahorro <span className="text-gray-300 normal-case">(opc.)</span>
                    </label>
                    <select
                      {...register('goal_id', {
                        setValueAs: (v) => (v === '' || v === '0' ? null : Number(v)),
                      })}
                      className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                    >
                      <option value="">Sin meta</option>
                      {savingGoals.map((goal) => {
                        const progress = goal.target_amount_cents > 0
                          ? Math.min(100, Math.round(((goal.saved_cents || 0) / goal.target_amount_cents) * 100))
                          : 0
                        return (
                          <option key={goal.id} value={goal.id}>
                            {goal.name} ({progress}%)
                          </option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {/* Monto */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Monto a Ahorrar
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('amount_cents', {
                        setValueAs: (v) => (v === '' || v === null ? 0 : Math.round(parseFloat(v) * 100)),
                      })}
                      className="fintech-input w-full pl-8 pr-4 py-3 text-sm text-gray-800 font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount_cents && (
                    <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.amount_cents.message}</p>
                  )}
                </div>

                {/* Fecha y Nota */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Fecha
                    </label>
                    <input
                      type="date"
                      {...register('entry_date')}
                      className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Nota <span className="text-gray-300 normal-case">(opc.)</span>
                    </label>
                    <input
                      type="text"
                      {...register('note')}
                      className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                      placeholder="Nota"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSavingsModal(false)
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
