import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UpsertPayPeriodInputSchema, payPeriodsApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'

export function PayPeriods() {
  const { activeUserId } = useAuthStore()
  const { payPeriods, setPayPeriods } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const formatCurrency = (cents: number | null) => {
    if (cents === null || cents === undefined) return 'No registrado'
    return new Intl.NumberFormat('es-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(cents / 100)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha no disponible'

    // Si la fecha ya incluye la hora, usarla directamente; si no, agregar T00:00:00
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
        <div className="max-w-4xl mx-auto">
          <LoadingBar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white">Quincenas</h1>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 glass-button rounded-2xl text-[13px] font-semibold text-[#22d3ee] dark:text-[#4da3ff]"
            >
              + Nueva Quincena
            </button>
          )}
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Formulario de creación/edición */}
        {showCreateForm && (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 mb-6">
            <h3 className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white mb-4">
              Registrar Quincena
            </h3>

            <form onSubmit={handleSubmit(onUpsertPayPeriod)} className="space-y-4">
              {/* Fecha de pago */}
              <div>
                <label htmlFor="pay_date" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Fecha de Pago
                </label>
                <input
                  id="pay_date"
                  type="date"
                  {...register('pay_date')}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                />
                {errors.pay_date && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.pay_date.message}
                  </p>
                )}
              </div>

              {/* Ingreso bruto (opcional) */}
              <div>
                <label htmlFor="gross_income_cents" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Ingreso Bruto (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] dark:text-neutral-400 text-[15px]">
                    $
                  </span>
                  <input
                    id="gross_income_cents"
                    type="number"
                    step="0.01"
                    {...register('gross_income_cents', {
                      setValueAs: (v) => (v === '' || v === null ? null : Math.round(parseFloat(v) * 100)),
                    })}
                    className="glass-input w-full pl-8 pr-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                    placeholder="0.00"
                  />
                </div>
                {errors.gross_income_cents && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.gross_income_cents.message}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#666] dark:text-neutral-500">
                  Ingresa el monto en dólares (ej: 1500.50)
                </p>
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
                  placeholder="Ej: Pago con bono extra"
                />
                {errors.note && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.note.message}
                  </p>
                )}
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

        {/* Lista de quincenas */}
        {payPeriods.length === 0 ? (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
            <p className="text-[17px] font-medium text-[#1a1a1a] dark:text-white mb-2">
              No hay quincenas registradas
            </p>
            <p className="text-[15px] text-[#666] dark:text-neutral-400 mb-4">
              Registra tu primera quincena para comenzar a gestionar tus finanzas
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]"
              >
                Registrar Primera Quincena
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {payPeriods.map((period) => (
              <div
                key={period.id}
                className="glass-card-light dark:glass-card-dark rounded-2xl p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">
                          {formatDate(period.pay_date)}
                        </p>
                        <p className="text-[13px] text-[#666] dark:text-neutral-400">
                          Quincena #{period.id}
                        </p>
                      </div>
                    </div>

                    {period.note && (
                      <p className="text-[15px] text-[#666] dark:text-neutral-300 mt-2 ml-11">
                        {period.note}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-[13px] text-[#666] dark:text-neutral-400 mb-1">
                      Ingreso Bruto
                    </p>
                    <p className={`text-[17px] font-bold ${
                      period.gross_income_cents
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-[#999] dark:text-neutral-500'
                    }`}>
                      {formatCurrency(period.gross_income_cents)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
