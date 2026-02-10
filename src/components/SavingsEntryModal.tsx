import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSavingEntryInputSchema, savingsApi } from '../lib/api'
import type { Account, SavingGoal, PayPeriod } from '../lib/api'
import { Icons } from './Icons'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface SavingsEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void | Promise<void>
  accounts: Account[]
  savingGoals: SavingGoal[]
  payPeriods?: PayPeriod[]
  userId: number
  defaultAccountId?: number
  defaultGoalId?: number | null
  defaultAmountCents?: number
  defaultDate?: string
  defaultPayPeriodId?: number | null
  defaultNote?: string
  subtitleText?: string
}

export function SavingsEntryModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  savingGoals,
  payPeriods,
  userId,
  defaultAccountId,
  defaultGoalId,
  defaultAmountCents,
  defaultDate,
  defaultPayPeriodId,
  defaultNote,
  subtitleText,
}: SavingsEntryModalProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(CreateSavingEntryInputSchema),
    defaultValues: {
      user_id: userId,
      account_id: 0,
      amount_cents: 0,
      entry_date: '',
      pay_period_id: null as number | null,
      note: '',
      goal_id: null as number | null,
      goal_amount_cents: null as number | null,
    },
  })

  useEffect(() => {
    if (isOpen) {
      setError(null)
      reset({
        user_id: userId,
        account_id: defaultAccountId || accounts.find(a => a.type === 'savings')?.id || accounts[0]?.id || 0,
        amount_cents: defaultAmountCents || 0,
        entry_date: defaultDate || new Date().toISOString().split('T')[0],
        pay_period_id: defaultPayPeriodId ?? null,
        note: defaultNote || '',
        goal_id: defaultGoalId ?? null,
        goal_amount_cents: null,
      })
    }
  }, [isOpen])

  const onSubmit = async (data: any) => {
    try {
      setError(null)
      const goalId = data.goal_id ? Number(data.goal_id) : null
      await savingsApi.createEntry({
        user_id: userId,
        account_id: data.account_id,
        amount_cents: data.amount_cents,
        entry_date: data.entry_date,
        pay_period_id: data.pay_period_id || null,
        note: data.note || null,
        goal_id: goalId,
        goal_amount_cents: goalId ? data.amount_cents : null,
      })

      onClose()
      reset()
      await onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar ahorro')
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha no disponible'
    const dateToFormat = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const date = new Date(dateToFormat)
    if (isNaN(date.getTime())) return 'Fecha invalida'
    return new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
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
                {subtitleText && (
                  <p className="text-xs text-gray-400 font-semibold">{subtitleText}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
              <XMarkIcon
                className="w-4 h-4 text-red-400 cursor-pointer shrink-0 mt-0.5"
                onClick={() => setError(null)}
              />
              <p className="text-xs text-red-600 font-semibold">{error}</p>
            </div>
          )}

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

          {/* Quincena (opcional, solo si se pasan payPeriods) */}
          {payPeriods && payPeriods.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Quincena <span className="text-gray-300 normal-case">(opc.)</span>
              </label>
              <select
                {...register('pay_period_id', {
                  setValueAs: (v) => (v === '' || v === null ? null : parseInt(v)),
                })}
                className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
              >
                <option value="">Sin quincena</option>
                {payPeriods.map((pp) => (
                  <option key={pp.id} value={pp.id}>
                    {formatDate(pp.pay_date)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
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
  )
}
