import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  summaryApi,
  transactionsApi,
  savingsApi,
  goalsApi,
  CreateSavingEntryInputSchema,
  type PayPeriodSummary,
  type Transaction,
  type PayPeriod,
  type SavingEntry,
} from '../lib/api'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from './LoadingBar'
import { Icons } from './Icons'
import {
  XMarkIcon,
  ArrowLeftIcon,
  SparklesIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ScaleIcon,
  ArrowDownCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'

interface PayPeriodDetailProps {
  payPeriod: PayPeriod
  onClose: () => void
}


export function PayPeriodDetail({ payPeriod, onClose }: PayPeriodDetailProps) {
  const { accounts, categories, savingGoals, setSavingGoals } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<PayPeriodSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingEntries, setSavingEntries] = useState<SavingEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  // Modal "Guardar en Savings"
  const [showSavingsModal, setShowSavingsModal] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(CreateSavingEntryInputSchema),
    defaultValues: {
      user_id: payPeriod.user_id,
      account_id: 0,
      amount_cents: 0,
      entry_date: payPeriod.pay_date,
      pay_period_id: payPeriod.id,
      note: '',
      goal_id: null as number | null,
      goal_amount_cents: null as number | null,
    },
  })

  useEffect(() => {
    loadData()
  }, [payPeriod.id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [summaryData, transactionsData, savingEntriesData, goalsData] = await Promise.all([
        summaryApi.getPayPeriodSummary(payPeriod.id),
        transactionsApi.list({
          userId: payPeriod.user_id,
          pay_period_id: payPeriod.id,
        }),
        savingsApi.listEntries({
          userId: payPeriod.user_id,
          pay_period_id: payPeriod.id,
        }),
        goalsApi.listByUser(payPeriod.user_id),
      ])

      setSummary(summaryData)
      setTransactions(transactionsData)
      setSavingEntries(savingEntriesData)
      setSavingGoals(goalsData)
    } catch (err) {
      console.error('Error loading pay period detail:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenSavingsModal = () => {
    setShowSavingsModal(true)
    reset({
      user_id: payPeriod.user_id,
      account_id: accounts.find(a => a.type === 'savings')?.id || accounts[0]?.id || 0,
      amount_cents: summary?.leftover_cents || 0,
      entry_date: payPeriod.pay_date,
      pay_period_id: payPeriod.id,
      note: `Ahorro de quincena ${formatDate(payPeriod.pay_date)}`,
      goal_id: null,
      goal_amount_cents: null,
    })
  }

  const onCreateSavingEntry = async (data: any) => {
    try {
      setError(null)
      const goalId = data.goal_id ? Number(data.goal_id) : null
      await savingsApi.createEntry({
        user_id: payPeriod.user_id,
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
      await loadData()
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

  const getAccountName = (accountId: number) => {
    return accounts.find((a) => a.id === accountId)?.name || `Cuenta #${accountId}`
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Sin categoria'
    return categories.find((c) => c.id === categoryId)?.name || `Categoria #${categoryId}`
  }

  // Agrupar transacciones
  const incomeTransactions = transactions.filter((t) => t.type === 'income')
  const expenseTransactions = transactions.filter((t) => t.type === 'expense')
  const transferTransactions = transactions.filter((t) => t.type === 'transfer')
  const adjustmentTransactions = transactions.filter((t) => t.type === 'adjustment')

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
      <div className="bg-gradient-to-br from-[#d821f9] to-[#a018c0] px-6 pt-6 pb-28 rounded-b-[32px]">
        <div className="max-w-lg mx-auto">
          {/* Boton volver */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Volver al resumen
          </button>

          <p className="text-white/70 text-sm font-semibold mb-1">Detalle de quincena</p>
          <h1 className="text-white text-2xl font-extrabold mb-1">
            {formatDate(payPeriod.pay_date)}
          </h1>
          {payPeriod.note && (
            <p className="text-white/50 text-sm font-semibold">{payPeriod.note}</p>
          )}

          {/* Ingreso total de esta quincena */}
          {summary && (
            <div className="flex items-center justify-between mt-5">
              <div>
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Ingresos</p>
                <p className="text-white text-2xl font-black">
                  {formatCurrency(summary.gross_income_cents + summary.additional_income_cents)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Gastos</p>
                <p className="text-white text-2xl font-black">
                  {formatCurrency(Math.abs(summary.expenses_out_cents))}
                </p>
              </div>
            </div>
          )}
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

        {/* Resumen financiero */}
        {summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              <div className="fintech-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icons.TrendingUp className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Sueldo</p>
                </div>
                <p className="text-[14px] font-extrabold text-green-600">{formatCurrency(summary.gross_income_cents)}</p>
              </div>
              <div className="fintech-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icons.DollarCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Adicional</p>
                </div>
                <p className="text-[14px] font-extrabold text-emerald-600">{formatCurrency(summary.additional_income_cents)}</p>
              </div>
              <div className="fintech-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icons.TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Gastos</p>
                </div>
                <p className="text-[14px] font-extrabold text-red-600">{formatCurrency(summary.expenses_out_cents)}</p>
              </div>
              <div className="fintech-card p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icons.PiggyBank className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Ahorros</p>
                </div>
                <p className="text-[14px] font-extrabold text-blue-600">{formatCurrency(summary.savings_out_cents)}</p>
              </div>
            </div>

            {/* Disponible + CTA */}
            <div className={`fintech-card p-4 mb-5 flex items-center justify-between ${
              summary.leftover_cents > 0 ? 'border-[#d821f9]/20' : ''
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  summary.leftover_cents > 0 ? 'bg-purple-50' : 'bg-gray-100'
                }`}>
                  <SparklesIcon className={`w-5 h-5 ${
                    summary.leftover_cents > 0 ? 'text-[#d821f9]' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Disponible</p>
                  <p className={`text-lg font-extrabold ${
                    summary.leftover_cents >= 0 ? 'text-[#d821f9]' : 'text-red-500'
                  }`}>
                    {formatCurrency(summary.leftover_cents)}
                  </p>
                </div>
              </div>
              {summary.leftover_cents > 0 && (
                <button
                  onClick={handleOpenSavingsModal}
                  className="px-4 py-2 fintech-btn-primary text-xs"
                >
                  Ahorrar
                </button>
              )}
            </div>
          </>
        )}

        {/* ============ TRANSACCIONES POR TIPO ============ */}
        <h2 className="text-base font-extrabold text-gray-800 mb-3">
          Transacciones
          <span className="text-gray-400 font-bold ml-1">({transactions.length})</span>
        </h2>

        {transactions.length === 0 && savingEntries.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Icons.CreditCard className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-500">Sin transacciones</p>
            <p className="text-xs text-gray-400 mt-1">No hay movimientos registrados en esta quincena</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ingresos */}
            {incomeTransactions.length > 0 && (
              <TransactionGroup
                title="Ingresos"
                count={incomeTransactions.length}
                iconBg="bg-green-50"
                iconColor="text-green-500"
                Icon={BanknotesIcon}
                transactions={incomeTransactions}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getAccountName={getAccountName}
                getCategoryName={getCategoryName}
              />
            )}

            {/* Gastos */}
            {expenseTransactions.length > 0 && (
              <TransactionGroup
                title="Gastos"
                count={expenseTransactions.length}
                iconBg="bg-red-50"
                iconColor="text-red-500"
                Icon={ArrowDownCircleIcon}
                transactions={expenseTransactions}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getAccountName={getAccountName}
                getCategoryName={getCategoryName}
              />
            )}

            {/* Transferencias */}
            {transferTransactions.length > 0 && (
              <TransactionGroup
                title="Transferencias"
                count={transferTransactions.length}
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
                Icon={ArrowPathIcon}
                transactions={transferTransactions}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getAccountName={getAccountName}
                getCategoryName={getCategoryName}
              />
            )}

            {/* Ajustes */}
            {adjustmentTransactions.length > 0 && (
              <TransactionGroup
                title="Ajustes"
                count={adjustmentTransactions.length}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
                Icon={ScaleIcon}
                transactions={adjustmentTransactions}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getAccountName={getAccountName}
                getCategoryName={getCategoryName}
              />
            )}

            {/* Ahorros */}
            {savingEntries.length > 0 && (
              <div className="fintech-card overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                  <div className={`w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center`}>
                    <Icons.PiggyBank className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide">
                    Ahorros ({savingEntries.length})
                  </p>
                </div>
                {savingEntries.map((entry, index) => {
                  const isDeposit = entry.amount_cents > 0
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 px-5 py-3 ${
                        index !== savingEntries.length - 1 ? 'border-b border-gray-100' : 'pb-4'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDeposit ? 'bg-emerald-50' : 'bg-orange-50'
                      }`}>
                        {isDeposit
                          ? <ArrowUpTrayIcon className="w-4 h-4 text-emerald-500" />
                          : <ArrowDownTrayIcon className="w-4 h-4 text-orange-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {entry.note || (isDeposit ? 'Deposito a ahorros' : 'Retiro de ahorros')}
                        </p>
                        <p className="text-xs text-gray-400 font-semibold">
                          {formatDate(entry.entry_date)} · {getAccountName(entry.account_id)}
                        </p>
                      </div>
                      <p className={`text-sm font-extrabold shrink-0 ${
                        isDeposit ? 'text-emerald-500' : 'text-orange-500'
                      }`}>
                        {isDeposit ? '+' : ''}{formatCurrency(entry.amount_cents)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
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
                        Disponible: {formatCurrency(summary?.leftover_cents || 0)}
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
                  {formErrors.account_id && (
                    <p className="mt-1.5 text-xs text-red-500 font-semibold">{formErrors.account_id.message}</p>
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
                  {formErrors.amount_cents && (
                    <p className="mt-1.5 text-xs text-red-500 font-semibold">{formErrors.amount_cents.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Fecha</label>
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

// Componente reutilizable para grupo de transacciones
function TransactionGroup({
  title,
  count,
  iconBg,
  iconColor,
  Icon,
  transactions,
  formatCurrency,
  formatDate,
  getAccountName,
  getCategoryName,
}: {
  title: string
  count: number
  iconBg: string
  iconColor: string
  Icon: React.ElementType
  transactions: Transaction[]
  formatCurrency: (cents: number) => string
  formatDate: (dateStr: string) => string
  getAccountName: (id: number) => string
  getCategoryName: (id: number | null) => string
}) {
  return (
    <div className="fintech-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <div className={`w-7 h-7 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
        <p className={`text-xs font-bold ${iconColor} uppercase tracking-wide`}>
          {title} ({count})
        </p>
      </div>
      {transactions.map((txn, index) => {
        const isPositive = txn.amount_cents >= 0
        return (
          <div
            key={txn.id}
            className={`flex items-center gap-4 px-5 py-3 ${
              index !== transactions.length - 1 ? 'border-b border-gray-100' : 'pb-4'
            }`}
          >
            <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">
                {txn.description || getCategoryName(txn.category_id)}
              </p>
              <p className="text-xs text-gray-400 font-semibold truncate">
                {formatDate(txn.txn_date)} · {getAccountName(txn.account_id)}
              </p>
            </div>
            <p className={`text-sm font-extrabold shrink-0 ${
              isPositive ? 'text-green-500' : 'text-red-500'
            }`}>
              {isPositive ? '+' : ''}{formatCurrency(txn.amount_cents)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
