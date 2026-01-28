import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  summaryApi,
  transactionsApi,
  savingsApi,
  CreateSavingEntryInputSchema,
  type PayPeriodSummary,
  type Transaction,
  type PayPeriod,
  type SavingEntry,
} from '../lib/api'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from './LoadingBar'
import {
  BanknotesIcon,
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BuildingLibraryIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ScaleIcon,
  ArrowDownCircleIcon
} from '@heroicons/react/24/outline'

interface PayPeriodDetailProps {
  payPeriod: PayPeriod
  onClose: () => void
}

export function PayPeriodDetail({ payPeriod, onClose }: PayPeriodDetailProps) {
  const { accounts, categories } = useWalletStore()
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
    },
  })

  useEffect(() => {
    loadData()
  }, [payPeriod.id])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [summaryData, transactionsData, savingEntriesData] = await Promise.all([
        summaryApi.getPayPeriodSummary(payPeriod.id),
        transactionsApi.list({
          userId: payPeriod.user_id,
          pay_period_id: payPeriod.id,
        }),
        savingsApi.listEntries({
          userId: payPeriod.user_id,
          pay_period_id: payPeriod.id,
        }),
      ])

      setSummary(summaryData)
      setTransactions(transactionsData)
      setSavingEntries(savingEntriesData)
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
    })
  }

  const onCreateSavingEntry = async (data: any) => {
    try {
      setError(null)
      await savingsApi.createEntry({
        user_id: payPeriod.user_id,
        account_id: data.account_id,
        amount_cents: data.amount_cents,
        entry_date: data.entry_date,
        pay_period_id: data.pay_period_id || null,
        note: data.note || null,
      })

      setShowSavingsModal(false)
      reset()
      // Recargar datos para actualizar savings_out_cents
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
    if (isNaN(date.getTime())) return 'Fecha inválida'
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
    if (!categoryId) return 'Sin categoría'
    return categories.find((c) => c.id === categoryId)?.name || `Categoría #${categoryId}`
  }

  const getTransactionTypeInfo = (type: string) => {
    const types: Record<string, { label: string; Icon: React.ElementType; color: string }> = {
      income: { label: 'Ingreso', Icon: BanknotesIcon, color: 'text-green-600 dark:text-green-400' },
      expense: { label: 'Gasto', Icon: ArrowDownCircleIcon, color: 'text-red-600 dark:text-red-400' },
      transfer: { label: 'Transferencia', Icon: ArrowPathIcon, color: 'text-blue-600 dark:text-blue-400' },
      adjustment: { label: 'Ajuste', Icon: ScaleIcon, color: 'text-yellow-600 dark:text-yellow-400' },
    }
    return types[type] || types.expense
  }

  // Agrupar transacciones por tipo
  const incomeTransactions = transactions.filter((t) => t.type === 'income')
  const expenseTransactions = transactions.filter((t) => t.type === 'expense')
  const transferTransactions = transactions.filter((t) => t.type === 'transfer')
  const adjustmentTransactions = transactions.filter((t) => t.type === 'adjustment')

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
        {/* Header con botón volver */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onClose}
            className="p-2 glass-button rounded-xl hover:bg-white/20 transition-all duration-200"
          >
            <svg className="w-6 h-6 text-[#666] dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white">
              Quincena {formatDate(payPeriod.pay_date)}
            </h1>
            {payPeriod.note && (
              <p className="text-[15px] text-[#666] dark:text-neutral-400 mt-1">
                {payPeriod.note}
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Resumen Financiero */}
        {summary && (
          <div className="mb-8">
            <h2 className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-4">
              Resumen Financiero
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Ingreso Bruto */}
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4">
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
                  Sueldo
                </p>
              </div>

              {/* Ingresos Adicionales */}
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4">
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
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4">
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
                  + transferencias
                </p>
              </div>

              {/* Ahorros */}
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4">
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
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4">
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
              <div className="glass-card-light dark:glass-card-dark rounded-2xl p-4 bg-gradient-to-br from-[#22d3ee]/10 to-[#06b6d4]/10 dark:from-[#4da3ff]/10 dark:to-[#3b82f6]/10 border-2 border-[#22d3ee]/30 dark:border-[#4da3ff]/30">
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
              <div className="mt-4 glass-card-light dark:glass-card-dark rounded-2xl p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white mb-1">
                      💡 Tienes {formatCurrency(summary.leftover_cents)} disponible
                    </p>
                    <p className="text-[13px] text-[#666] dark:text-neutral-400">
                      ¿Quieres guardar parte en ahorros?
                    </p>
                  </div>
                  <button
                    onClick={handleOpenSavingsModal}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl text-[15px] font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Guardar en Ahorros
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transacciones */}
        <div>
          <h2 className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-4">
            Transacciones ({transactions.length})
          </h2>

          {transactions.length === 0 ? (
            <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
              <p className="text-[17px] font-medium text-[#1a1a1a] dark:text-white mb-2">
                No hay transacciones
              </p>
              <p className="text-[15px] text-[#666] dark:text-neutral-400">
                No hay transacciones registradas en esta quincena
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Ingresos */}
              {incomeTransactions.length > 0 && (
                <div className="glass-card-light dark:glass-card-dark rounded-2xl p-5">
                  <p className="text-[13px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BanknotesIcon className="w-5 h-5" /> Ingresos ({incomeTransactions.length})
                  </p>
                  <div className="space-y-2">
                    {incomeTransactions.map((txn) => (
                      <TransactionRow
                        key={txn.id}
                        transaction={txn}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getAccountName={getAccountName}
                        getCategoryName={getCategoryName}
                        getTransactionTypeInfo={getTransactionTypeInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Columna Gastos */}
              {expenseTransactions.length > 0 && (
                <div className="glass-card-light dark:glass-card-dark rounded-2xl p-5">
                  <p className="text-[13px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ArchiveBoxIcon className="w-5 h-5" /> Gastos ({expenseTransactions.length})
                  </p>
                  <div className="space-y-2">
                    {expenseTransactions.map((txn) => (
                      <TransactionRow
                        key={txn.id}
                        transaction={txn}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getAccountName={getAccountName}
                        getCategoryName={getCategoryName}
                        getTransactionTypeInfo={getTransactionTypeInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Columna Transferencias */}
              {transferTransactions.length > 0 && (
                <div className="glass-card-light dark:glass-card-dark rounded-2xl p-5">
                  <p className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ArrowPathIcon className="w-5 h-5" /> Transferencias ({transferTransactions.length})
                  </p>
                  <div className="space-y-2">
                    {transferTransactions.map((txn) => (
                      <TransactionRow
                        key={txn.id}
                        transaction={txn}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getAccountName={getAccountName}
                        getCategoryName={getCategoryName}
                        getTransactionTypeInfo={getTransactionTypeInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Columna Ajustes */}
              {adjustmentTransactions.length > 0 && (
                <div className="glass-card-light dark:glass-card-dark rounded-2xl p-5">
                  <p className="text-[13px] font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ScaleIcon className="w-5 h-5" /> Ajustes ({adjustmentTransactions.length})
                  </p>
                  <div className="space-y-2">
                    {adjustmentTransactions.map((txn) => (
                      <TransactionRow
                        key={txn.id}
                        transaction={txn}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getAccountName={getAccountName}
                        getCategoryName={getCategoryName}
                        getTransactionTypeInfo={getTransactionTypeInfo}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Columna Ahorros */}
              {savingEntries.length > 0 && (
                <div className="glass-card-light dark:glass-card-dark rounded-2xl p-5">
                  <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BuildingLibraryIcon className="w-5 h-5" /> Ahorros ({savingEntries.length})
                  </p>
                  <div className="space-y-2">
                    {savingEntries.map((entry) => (
                      <SavingEntryRow
                        key={entry.id}
                        entry={entry}
                        formatCurrency={formatCurrency}
                        formatDate={formatDate}
                        getAccountName={getAccountName}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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
                  {formErrors.account_id && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {formErrors.account_id.message}
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
                    Disponible: {formatCurrency(summary?.leftover_cents || 0)}
                  </p>
                  {formErrors.amount_cents && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {formErrors.amount_cents.message}
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

// Componente interno para mostrar una transacción
function TransactionRow({
  transaction,
  formatCurrency,
  formatDate,
  getAccountName,
  getCategoryName,
  getTransactionTypeInfo,
}: {
  transaction: Transaction
  formatCurrency: (cents: number) => string
  formatDate: (dateStr: string) => string
  getAccountName: (id: number) => string
  getCategoryName: (id: number | null) => string
  getTransactionTypeInfo: (type: string) => { label: string; Icon: React.ElementType; color: string }
}) {
  const typeInfo = getTransactionTypeInfo(transaction.type)
  const isPositive = transaction.amount_cents >= 0

  return (
    <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 text-lg text-[#666] dark:text-[#aaa]">
          <typeInfo.Icon className={`w-6 h-6 ${typeInfo.color.split(' ')[0]}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#1a1a1a] dark:text-white truncate">
            {transaction.description || getCategoryName(transaction.category_id)}
          </p>
          <p className="text-[11px] text-[#666] dark:text-neutral-400">
            {formatDate(transaction.txn_date)} • {getAccountName(transaction.account_id)}
          </p>
        </div>
      </div>
      <p className={`text-[15px] font-bold flex-shrink-0 ml-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
        {isPositive ? '+' : ''}{formatCurrency(transaction.amount_cents)}
      </p>
    </div>
  )
}

// Componente interno para mostrar una entrada de ahorro
function SavingEntryRow({
  entry,
  formatCurrency,
  formatDate,
  getAccountName,
}: {
  entry: SavingEntry
  formatCurrency: (cents: number) => string
  formatDate: (dateStr: string) => string
  getAccountName: (id: number) => string
}) {
  const isDeposit = entry.amount_cents > 0

  return (
    <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex-shrink-0 text-lg">
          {isDeposit ? <ArrowUpTrayIcon className="w-6 h-6 text-emerald-500" /> : <ArrowDownTrayIcon className="w-6 h-6 text-orange-500" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#1a1a1a] dark:text-white truncate">
            {entry.note || (isDeposit ? 'Depósito a ahorros' : 'Retiro de ahorros')}
          </p>
          <p className="text-[11px] text-[#666] dark:text-neutral-400">
            {formatDate(entry.entry_date)} • {getAccountName(entry.account_id)}
          </p>
        </div>
      </div>
      <p className={`text-[15px] font-bold flex-shrink-0 ml-2 ${isDeposit ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
        }`}>
        {isDeposit ? '+' : ''}{formatCurrency(entry.amount_cents)}
      </p>
    </div>
  )
}
