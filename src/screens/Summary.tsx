import { useState, useEffect } from 'react'
import { summaryApi, goalsApi, payPeriodsApi, accountsApi, categoriesApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { formatCurrency } from '../lib/format'
import { LoadingBar } from '../components/LoadingBar'
import { PayPeriodDetail } from '../components/PayPeriodDetail'
import { SavingsEntryModal } from '../components/SavingsEntryModal'
import { TransactionModal } from '../components/TransactionModal'
import { Icons } from '../components/Icons'
import type { PayPeriodSummary, PayPeriod } from '../lib/api'
import {
  XMarkIcon,
  ChevronRightIcon,
  SparklesIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

export function Summary() {
  const { activeUserId } = useAuthStore()
  const { payPeriods, setPayPeriods, accounts, setAccounts, categories, setCategories, savingGoals, setSavingGoals } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [summaries, setSummaries] = useState<Map<number, PayPeriodSummary>>(new Map())
  const [error, setError] = useState<string | null>(null)

  // Modal "Guardar en Savings"
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  const [selectedLeftover, setSelectedLeftover] = useState<number>(0)
  const [selectedPayPeriodId, setSelectedPayPeriodId] = useState<number | null>(null)

  // Modal "Nueva Transaccion"
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [transactionPayPeriodId, setTransactionPayPeriodId] = useState<number | null>(null)

  // Modal detalle de quincena
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod | null>(null)

  useEffect(() => {
    if (activeUserId) {
      loadAllData()
    }
  }, [activeUserId])

  const loadAllData = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const [payPeriodsData, accountsData, goalsData, categoriesData] = await Promise.all([
        payPeriodsApi.listByUser(activeUserId),
        accountsApi.listByUser(activeUserId),
        goalsApi.listByUser(activeUserId),
        categoriesApi.list(activeUserId),
      ])

      setPayPeriods(payPeriodsData)
      setAccounts(accountsData)
      setSavingGoals(goalsData)
      setCategories(categoriesData)

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
    setSelectedPayPeriodId(payPeriodId)
    setShowSavingsModal(true)
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setTransactionPayPeriodId(payPeriod.id)
                              setShowTransactionModal(true)
                            }}
                            className="px-3 py-1.5 fintech-btn-secondary text-xs flex items-center gap-1"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Transaccion
                          </button>
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
        <SavingsEntryModal
          isOpen={showSavingsModal}
          onClose={() => setShowSavingsModal(false)}
          onSuccess={loadAllData}
          accounts={accounts}
          savingGoals={savingGoals}
          userId={activeUserId!}
          defaultAccountId={accounts.find(a => a.type === 'savings')?.id}
          defaultAmountCents={selectedLeftover}
          defaultDate={payPeriods.find(pp => pp.id === selectedPayPeriodId)?.pay_date}
          defaultPayPeriodId={selectedPayPeriodId}
          defaultNote={`Ahorro de quincena ${payPeriods.find(pp => pp.id === selectedPayPeriodId)?.pay_date || ''}`}
          subtitleText={`Disponible: ${formatCurrency(selectedLeftover)}`}
        />

        {/* ============ MODAL NUEVA TRANSACCION ============ */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          onSuccess={loadAllData}
          accounts={accounts}
          categories={categories}
          payPeriods={payPeriods}
          userId={activeUserId!}
          defaultPayPeriodId={transactionPayPeriodId}
        />
      </div>
    </div>
  )
}
