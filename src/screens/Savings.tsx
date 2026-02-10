import { useState, useEffect } from 'react'
import { savingsApi, payPeriodsApi, accountsApi, goalsApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { formatCurrency } from '../lib/format'
import { LoadingBar } from '../components/LoadingBar'
import { SavingsEntryModal } from '../components/SavingsEntryModal'
import {
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { Icons } from '../components/Icons'

export function Savings() {
  const { activeUserId } = useAuthStore()
  const { savingEntries, setSavingEntries, accounts, setAccounts, payPeriods, setPayPeriods, savingGoals, setSavingGoals } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filterPayPeriod, setFilterPayPeriod] = useState<number | null>(null)
  const [filterFrom, setFilterFrom] = useState<string>('')
  const [filterTo, setFilterTo] = useState<string>('')
  const [filterAccount, setFilterAccount] = useState<number | null>(null)


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
      const [entriesData, accountsData, payPeriodsData, goalsData] = await Promise.all([
        savingsApi.listEntries({ userId: activeUserId }),
        accountsApi.listByUser(activeUserId),
        payPeriodsApi.listByUser(activeUserId),
        goalsApi.listByUser(activeUserId),
      ])
      setSavingEntries(entriesData)
      setAccounts(accountsData)
      setPayPeriods(payPeriodsData)
      setSavingGoals(goalsData)
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
    const account = accounts.find((a) => a.id === accountId)
    return account ? account.name : `Cuenta #${accountId}`
  }

  // Totales
  const totalSaved = savingEntries.reduce((sum, entry) => sum + entry.amount_cents, 0)
  const totalDeposits = savingEntries.filter(e => e.amount_cents > 0).reduce((sum, e) => sum + e.amount_cents, 0)
  const totalWithdrawals = savingEntries.filter(e => e.amount_cents < 0).reduce((sum, e) => sum + Math.abs(e.amount_cents), 0)

  const filteredEntries = filterAccount
    ? savingEntries.filter((e) => e.account_id === filterAccount)
    : savingEntries

  const hasActiveFilters = !!(filterPayPeriod || filterFrom || filterTo || filterAccount)

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
          {/* Greeting */}
          <p className="text-white/70 text-sm font-semibold mb-1">Hola de nuevo</p>
          <h1 className="text-white text-2xl font-extrabold mb-6">Mis Ahorros</h1>

          {/* Balance principal */}
          <div className="text-center">
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">
              Balance Total
            </p>
            <p className="text-white text-5xl font-black tracking-tight">
              {formatCurrency(totalSaved)}
            </p>
          </div>
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-lg mx-auto px-5 -mt-16 pb-8">
        {/* Mini cards: Ingresos / Egresos */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="fintech-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <Icons.TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Depositos</p>
              <p className="text-[16px] font-extrabold text-gray-800">{formatCurrency(totalDeposits)}</p>
            </div>
          </div>
          <div className="fintech-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Icons.TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase">Retiros</p>
              <p className="text-[16px] font-extrabold text-gray-800">{formatCurrency(totalWithdrawals)}</p>
            </div>
          </div>
        </div>

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

        {/* Boton nuevo aporte */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 fintech-btn-primary text-[15px] mb-5"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Aporte / Retiro
        </button>

        {/* ============ MODAL NUEVO APORTE ============ */}
        <SavingsEntryModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={loadAllData}
          accounts={accounts}
          savingGoals={savingGoals}
          payPeriods={payPeriods}
          userId={activeUserId!}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={filterPayPeriod || ''}
                  onChange={(e) => setFilterPayPeriod(e.target.value ? parseInt(e.target.value) : null)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                >
                  <option value="">Todas las quincenas</option>
                  {payPeriods.map((pp) => (
                    <option key={pp.id} value={pp.id}>{formatDate(pp.pay_date)}</option>
                  ))}
                </select>

                <select
                  value={filterAccount || ''}
                  onChange={(e) => setFilterAccount(e.target.value ? parseInt(e.target.value) : null)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                >
                  <option value="">Todas las cuentas</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                  placeholder="Desde"
                />

                <input
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                  className="fintech-input px-3 py-2.5 text-xs text-gray-700 font-semibold"
                  placeholder="Hasta"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFilterPayPeriod(null)
                    setFilterFrom('')
                    setFilterTo('')
                    setFilterAccount(null)
                  }}
                  className="mt-3 w-full py-2 text-xs font-bold text-[#d821f9] hover:bg-[#d821f9]/5 rounded-lg transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* ============ LISTA DE MOVIMIENTOS ============ */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-gray-800">Movimientos</h2>
          <span className="text-xs font-bold text-gray-400">{filteredEntries.length} registros</span>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#d821f9]/10 flex items-center justify-center mx-auto mb-4">
              <Icons.PiggyBank className="w-8 h-8 text-[#d821f9]" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">Sin movimientos</p>
            <p className="text-sm text-gray-400 mb-5">
              Registra tu primer aporte para comenzar
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 fintech-btn-primary text-sm"
              >
                Registrar Primer Aporte
              </button>
            )}
          </div>
        ) : (
          <div className="fintech-card overflow-hidden">
            {filteredEntries.map((entry, index) => {
              const isDeposit = entry.amount_cents > 0
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    index !== filteredEntries.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Icono */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isDeposit ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    {isDeposit
                      ? <Icons.TrendingUp className="w-5 h-5 text-green-500" />
                      : <Icons.TrendingDown className="w-5 h-5 text-red-500" />
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {isDeposit ? 'Deposito' : 'Retiro'}
                      {entry.note && <span className="font-semibold text-gray-400"> · {entry.note}</span>}
                    </p>
                    <p className="text-xs text-gray-400 font-semibold">
                      {formatDate(entry.entry_date)} · {getAccountName(entry.account_id)}
                    </p>
                  </div>

                  {/* Monto */}
                  <p className={`text-base font-extrabold shrink-0 ${
                    isDeposit ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isDeposit ? '+' : ''}{formatCurrency(entry.amount_cents)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
