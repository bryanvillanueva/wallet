import { useState, useEffect } from 'react'
import {
  summaryApi,
  transactionsApi,
  savingsApi,
  goalsApi,
  type PayPeriodSummary,
  type Transaction,
  type PayPeriod,
  type SavingEntry,
} from '../lib/api'
import { useWalletStore } from '../stores/useWalletStore'
import { formatCurrency } from '../lib/format'
import { LoadingBar } from './LoadingBar'
import { SavingsEntryModal } from './SavingsEntryModal'
import { TransactionModal } from './TransactionModal'
import { Icons } from './Icons'
import {
  XMarkIcon,
  ArrowLeftIcon,
  SparklesIcon,
  PlusIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ScaleIcon,
  ArrowDownCircleIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface PayPeriodDetailProps {
  payPeriod: PayPeriod
  onClose: () => void
}


export function PayPeriodDetail({ payPeriod, onClose }: PayPeriodDetailProps) {
  const { accounts, categories, payPeriods, savingGoals, setSavingGoals } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<PayPeriodSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingEntries, setSavingEntries] = useState<SavingEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  // Modal "Guardar en Savings"
  const [showSavingsModal, setShowSavingsModal] = useState(false)
  // Modal "Nueva Transaccion"
  const [showTransactionModal, setShowTransactionModal] = useState(false)

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
  }

  const handleOpenCreateTransaction = () => {
    setEditingTransaction(null)
    setShowTransactionModal(true)
  }

  const handleEditTransaction = (txn: Transaction) => {
    setEditingTransaction(txn)
    setShowTransactionModal(true)
  }

  const handleDeleteTransaction = async (txnId: number) => {
    if (!confirm('Estas seguro de eliminar esta transaccion?')) return
    try {
      await transactionsApi.delete(txnId)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar transaccion')
    }
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
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenCreateTransaction}
                  className="px-3 py-2 fintech-btn-secondary text-xs flex items-center gap-1"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  Transaccion
                </button>
                {summary.leftover_cents > 0 && (
                  <button
                    onClick={handleOpenSavingsModal}
                    className="px-4 py-2 fintech-btn-primary text-xs"
                  >
                    Ahorrar
                  </button>
                )}
              </div>
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
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
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
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
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
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
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
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
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
        <SavingsEntryModal
          isOpen={showSavingsModal}
          onClose={() => setShowSavingsModal(false)}
          onSuccess={loadData}
          accounts={accounts}
          savingGoals={savingGoals}
          userId={payPeriod.user_id}
          defaultAccountId={accounts.find(a => a.type === 'savings')?.id}
          defaultAmountCents={summary?.leftover_cents || 0}
          defaultDate={payPeriod.pay_date}
          defaultPayPeriodId={payPeriod.id}
          defaultNote={`Ahorro de quincena ${formatDate(payPeriod.pay_date)}`}
          subtitleText={`Disponible: ${formatCurrency(summary?.leftover_cents || 0)}`}
        />

        {/* ============ MODAL NUEVA TRANSACCION ============ */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false)
            setEditingTransaction(null)
          }}
          onSuccess={loadData}
          accounts={accounts}
          categories={categories}
          payPeriods={payPeriods}
          userId={payPeriod.user_id}
          defaultPayPeriodId={payPeriod.id}
          defaultDate={payPeriod.pay_date}
          transaction={editingTransaction}
        />
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
  onEdit,
  onDelete,
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
  onEdit?: (txn: Transaction) => void
  onDelete?: (txnId: number) => void
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
            <div className="flex items-center gap-2 shrink-0">
              <p className={`text-sm font-extrabold ${
                isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {isPositive ? '+' : ''}{formatCurrency(txn.amount_cents)}
              </p>
              {onEdit && (
                <button
                  onClick={() => onEdit(txn)}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-gray-300 hover:text-gray-600" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(txn.id)}
                  className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
