import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpsertPayPeriodInputSchema, payPeriodsApi, type PayPeriod } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { formatCurrency } from '../lib/format'
import { LoadingBar } from '../components/LoadingBar'
import { PayPeriodDetail } from '../components/PayPeriodDetail'
import { Icons } from '../components/Icons'
import {
  PlusIcon,
  XMarkIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

export function PayPeriods() {
  const { activeUserId } = useAuthStore()
  const { payPeriods, setPayPeriods } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<PayPeriod | null>(null)

  type FormData = {
    user_id: number
    pay_date: string
    gross_income_cents?: number | null
    note?: string | null
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(UpsertPayPeriodInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      gross_income_cents: null,
      note: '',
    },
  })

  useEffect(() => {
    if (activeUserId) {
      loadPayPeriods()
    }
  }, [activeUserId])

  const loadPayPeriods = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const data = await payPeriodsApi.listByUser(activeUserId)
      setPayPeriods(data)
    } catch (err) {
      console.error('Error loading pay periods:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar quincenas')
    } finally {
      setIsLoading(false)
    }
  }

  const onUpsertPayPeriod = async (data: FormData) => {
    try {
      setError(null)
      await payPeriodsApi.upsert({
        user_id: activeUserId!,
        pay_date: data.pay_date,
        gross_income_cents: data.gross_income_cents,
        note: data.note,
      })

      await loadPayPeriods()
      reset({
        user_id: activeUserId || 0,
        gross_income_cents: null,
        note: '',
      })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar quincena')
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

  // Resumen
  const totalIncome = payPeriods.reduce((sum, pp) => sum + (pp.gross_income_cents || 0), 0)
  const sortedPeriods = [...payPeriods].sort((a, b) => b.pay_date.localeCompare(a.pay_date))

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm font-semibold mb-1">Tus ingresos</p>
              <h1 className="text-white text-2xl font-extrabold">Quincenas</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm"
            >
              <PlusIcon className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Ingresos totales
              </p>
              <p className="text-white text-2xl font-black">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Quincenas
              </p>
              <p className="text-white text-2xl font-black">
                {payPeriods.length}
              </p>
            </div>
          </div>
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

        {/* Lista de quincenas */}
        {sortedPeriods.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <BanknotesIcon className="w-7 h-7 text-[#d821f9]" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">
              No hay quincenas registradas
            </p>
            <p className="text-sm text-gray-400 mb-5">
              Registra tu primera quincena para comenzar
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-5 py-2.5 fintech-btn-primary text-sm"
            >
              Registrar Primera Quincena
            </button>
          </div>
        ) : (
          <div className="fintech-card divide-y divide-gray-100">
            {sortedPeriods.map((period) => (
              <div
                key={period.id}
                onClick={() => setSelectedPayPeriod(period)}
                className="flex items-center gap-3.5 px-4 py-3.5 cursor-pointer hover:bg-gray-50/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Icons.DollarCircle className="w-5 h-5 text-[#d821f9]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {formatDate(period.pay_date)}
                  </p>
                  {period.note && (
                    <p className="text-xs text-gray-400 font-medium truncate">{period.note}</p>
                  )}
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <p className={`text-sm font-extrabold ${
                    period.gross_income_cents
                      ? 'text-green-600'
                      : 'text-gray-300'
                  }`}>
                    {formatCurrency(period.gross_income_cents)}
                  </p>
                  <ChevronRightIcon className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============ MODAL NUEVA QUINCENA ============ */}
      {showCreateForm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center"
          onClick={() => {
            setShowCreateForm(false)
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
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-[#d821f9]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800">Nueva Quincena</h3>
                    <p className="text-xs text-gray-400 font-semibold">Registrar ingreso</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    reset()
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit(onUpsertPayPeriod)} className="px-5 py-4 space-y-4">
              {/* Fecha de pago */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  {...register('pay_date')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                />
                {errors.pay_date && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.pay_date.message}</p>
                )}
              </div>

              {/* Ingreso bruto */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Ingreso Bruto <span className="text-gray-300 normal-case">(opc.)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('gross_income_cents', {
                      setValueAs: (v) => (v === '' || v === null ? null : Math.round(parseFloat(v) * 100)),
                    })}
                    className="fintech-input w-full pl-8 pr-4 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="0.00"
                  />
                </div>
                {errors.gross_income_cents && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.gross_income_cents.message}</p>
                )}
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nota <span className="text-gray-300 normal-case">(opc.)</span>
                </label>
                <input
                  type="text"
                  {...register('note')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                  placeholder="Ej: Pago con bono extra"
                />
                {errors.note && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.note.message}</p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
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
  )
}
