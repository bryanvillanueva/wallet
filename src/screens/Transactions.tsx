import { useState, useEffect } from 'react'
import {
  transactionsApi,
  categoriesApi,
  accountsApi,
  payPeriodsApi,
  type ListTransactionsParams,
  type Transaction,
} from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { formatCurrency } from '../lib/format'
import { LoadingBar } from '../components/LoadingBar'
import { Icons } from '../components/Icons'
import { TransactionModal } from '../components/TransactionModal'
import {
  PlusIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  TrashIcon,
  PencilSquareIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ScaleIcon,
  ArrowDownCircleIcon,
} from '@heroicons/react/24/outline'

const TRANSACTION_TYPES: Array<{
  value: 'income' | 'expense' | 'transfer' | 'adjustment'
  label: string
  Icon: React.ElementType
  bg: string
  color: string
}> = [
  { value: 'income', label: 'Ingreso', Icon: BanknotesIcon, bg: 'bg-green-50', color: 'text-green-500' },
  { value: 'expense', label: 'Gasto', Icon: ArrowDownCircleIcon, bg: 'bg-red-50', color: 'text-red-500' },
  { value: 'transfer', label: 'Transferencia', Icon: ArrowPathIcon, bg: 'bg-blue-50', color: 'text-blue-500' },
  { value: 'adjustment', label: 'Ajuste', Icon: ScaleIcon, bg: 'bg-amber-50', color: 'text-amber-500' },
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
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filterPayPeriod, setFilterPayPeriod] = useState<number | undefined>(undefined)
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  useEffect(() => {
    if (activeUserId) {
      loadRelatedData()
    }
  }, [activeUserId])

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

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Estas seguro de eliminar esta transaccion?')) return

    try {
      await transactionsApi.delete(id)
      await loadTransactions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar transaccion')
    }
  }

  const handleEditTransaction = (txn: Transaction) => {
    setEditingTransaction(txn)
    setShowTransactionModal(true)
  }

  const handleOpenCreate = () => {
    setEditingTransaction(null)
    setShowTransactionModal(true)
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

  const getTransactionTypeInfo = (type: string) => {
    return TRANSACTION_TYPES.find((t) => t.value === type) || TRANSACTION_TYPES[0]
  }

  const getAccountName = (accountId: number) => {
    return accounts.find((a) => a.id === accountId)?.name || `Cuenta #${accountId}`
  }

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'Sin categoria'
    return categories.find((c) => c.id === categoryId)?.name || `Categoria #${categoryId}`
  }

  // === YTD ===
  // Ingresos netos = quincenas + ingresos adicionales (transacciones tipo income)
  const ytdPayPeriodIncome = payPeriods.reduce((sum, pp) => sum + (pp.gross_income_cents || 0), 0)
  const ytdAdditionalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0)
  const ytdTotalIncome = ytdPayPeriodIncome + ytdAdditionalIncome

  // Gastos totales = gastos + transferencias
  const ytdTotalExpenses = transactions
    .filter((t) => t.type === 'expense' || t.type === 'transfer')
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0)

  // === Ultima quincena ===
  const sortedPayPeriods = [...payPeriods].sort((a, b) => b.pay_date.localeCompare(a.pay_date))
  const lastPayPeriod = sortedPayPeriods[0] || null

  const lastPPTransactions = lastPayPeriod
    ? transactions.filter((t) => t.pay_period_id === lastPayPeriod.id)
    : []
  const lastPPIncome = (lastPayPeriod?.gross_income_cents || 0) +
    lastPPTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0)
  const lastPPExpenses = lastPPTransactions
    .filter((t) => t.type === 'expense' || t.type === 'transfer')
    .reduce((sum, t) => sum + Math.abs(t.amount_cents), 0)

  const hasActiveFilters = !!(filterPayPeriod || filterDateFrom || filterDateTo)

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
          <p className="text-white/70 text-sm font-semibold mb-1">Control de gastos</p>
          <h1 className="text-white text-2xl font-extrabold mb-6">Movimientos</h1>

          {/* Resumen YTD en header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Ingresos YTD
              </p>
              <p className="text-white text-2xl font-black">
                {formatCurrency(ytdTotalIncome)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Gastos YTD
              </p>
              <p className="text-white text-2xl font-black">
                {formatCurrency(ytdTotalExpenses)}
              </p>
            </div>
          </div>
          <p className="text-white/30 text-[11px] font-semibold mt-2 text-center">
            {payPeriods.length} quincena{payPeriods.length !== 1 ? 's' : ''} registrada{payPeriods.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-lg mx-auto px-5 -mt-16 pb-8">
        {/* Card ultima quincena */}
        {lastPayPeriod && (
          <div className="fintech-card p-4 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
                <Icons.Calendar className="w-4.5 h-4.5 text-[#d821f9]" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">Ultima Quincena</p>
                <p className="text-xs text-gray-400 font-semibold">{formatDate(lastPayPeriod.pay_date)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50/60 rounded-xl p-3">
                <p className="text-[10px] text-green-600/60 font-bold uppercase mb-0.5">Ingresos</p>
                <p className="text-[15px] font-extrabold text-green-600">{formatCurrency(lastPPIncome)}</p>
              </div>
              <div className="bg-red-50/60 rounded-xl p-3">
                <p className="text-[10px] text-red-500/60 font-bold uppercase mb-0.5">Gastos</p>
                <p className="text-[15px] font-extrabold text-red-500">{formatCurrency(lastPPExpenses)}</p>
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

        {/* Boton nueva transaccion */}
        <button
          onClick={handleOpenCreate}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 fintech-btn-primary text-[15px] mb-5"
        >
          <PlusIcon className="w-5 h-5" />
          Nueva Transaccion
        </button>

        {/* Modal de transaccion */}
        <TransactionModal
          isOpen={showTransactionModal}
          onClose={() => {
            setShowTransactionModal(false)
            setEditingTransaction(null)
          }}
          onSuccess={loadTransactions}
          accounts={accounts}
          categories={categories}
          payPeriods={payPeriods}
          userId={activeUserId!}
          transaction={editingTransaction}
        />

        {/* ============ FILTROS ============ */}
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#d821f9] transition-colors"
          >
            <FunnelIcon className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#d821f9]" />
            )}
            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {showFilters && (
            <div className="fintech-card p-4 mt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select
                  value={filterPayPeriod || ''}
                  onChange={(e) => setFilterPayPeriod(e.target.value ? Number(e.target.value) : undefined)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                >
                  <option value="">Todas las quincenas</option>
                  {payPeriods.map((pp) => (
                    <option key={pp.id} value={pp.id}>{formatDate(pp.pay_date)}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                  placeholder="Desde"
                />

                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                  placeholder="Hasta"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterPayPeriod(undefined)
                    setFilterDateFrom('')
                    setFilterDateTo('')
                  }}
                  className="mt-3 w-full py-2 text-xs font-bold text-[#d821f9] hover:bg-[#d821f9]/5 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* ============ LISTA DE TRANSACCIONES ============ */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-gray-800">Transacciones</h2>
          <span className="text-xs font-bold text-gray-400">{transactions.length} registros</span>
        </div>

        {transactions.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Icons.CreditCard className="w-8 h-8 text-[#d821f9]" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">Sin transacciones</p>
            <p className="text-sm text-gray-400 mb-5">
              Registra tu primera transaccion para comenzar
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 fintech-btn-primary text-sm"
            >
              Registrar Primera Transaccion
            </button>
          </div>
        ) : (
          <div className="fintech-card overflow-hidden">
            {transactions.map((txn, index) => {
              const typeInfo = getTransactionTypeInfo(txn.type)
              const isPositive = txn.amount_cents >= 0

              return (
                <div
                  key={txn.id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    index !== transactions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Icono */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeInfo.bg}`}>
                    <typeInfo.Icon className={`w-5 h-5 ${typeInfo.color}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {txn.description || getCategoryName(txn.category_id)}
                      </p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-semibold truncate">
                      {formatDate(txn.txn_date)} · {getAccountName(txn.account_id)}
                      {txn.category_id ? ` · ${getCategoryName(txn.category_id)}` : ''}
                    </p>
                  </div>

                  {/* Monto y delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`text-base font-extrabold ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositive ? '+' : ''}{formatCurrency(txn.amount_cents)}
                    </p>
                    <button
                      onClick={() => handleEditTransaction(txn)}
                      className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <PencilSquareIcon className="w-3.5 h-3.5 text-gray-300 hover:text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(txn.id)}
                      className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                    >
                      <TrashIcon className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                    </button>
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
