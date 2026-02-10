import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CreateTransactionInputSchema,
  transactionsApi,
} from '../lib/api'
import type { Account, Category, PayPeriod, Transaction } from '../lib/api'
import {
  XMarkIcon,
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

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void | Promise<void>
  accounts: Account[]
  categories: Category[]
  payPeriods: PayPeriod[]
  userId: number
  transaction?: Transaction | null
  defaultType?: 'income' | 'expense' | 'transfer' | 'adjustment'
  defaultAccountId?: number
  defaultCategoryId?: number | null
  defaultPayPeriodId?: number | null
  defaultDate?: string
  defaultDescription?: string
}

type FormData = {
  user_id: number
  pay_period_id?: number | null
  account_id: number
  category_id?: number | null
  type: 'income' | 'expense' | 'transfer' | 'adjustment'
  amount_cents?: number
  description?: string | null
  txn_date: string
  planned_payment_id?: number | null
  counterparty_user_id?: number | null
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
  payPeriods,
  userId,
  transaction,
  defaultType = 'expense',
  defaultAccountId,
  defaultCategoryId,
  defaultPayPeriodId,
  defaultDate,
  defaultDescription,
}: TransactionModalProps) {
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(CreateTransactionInputSchema),
    defaultValues: {
      user_id: userId,
      type: defaultType,
      pay_period_id: null,
      category_id: null,
      txn_date: new Date().toISOString().split('T')[0],
    },
  })

  const selectedType = watch('type')
  const filteredCategories = categories.filter((c) => c.kind === selectedType)
  const isEditing = Boolean(transaction)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      if (transaction) {
        const normalizedCategoryId = (transaction.category_id && transaction.category_id > 0)
          ? transaction.category_id
          : null
        const normalizedPayPeriodId = (transaction.pay_period_id && transaction.pay_period_id > 0)
          ? transaction.pay_period_id
          : null
        const normalizedDate = transaction.txn_date?.includes('T')
          ? transaction.txn_date.split('T')[0]
          : transaction.txn_date
        reset({
          user_id: userId,
          type: transaction.type,
          account_id: transaction.account_id,
          category_id: normalizedCategoryId,
          pay_period_id: normalizedPayPeriodId,
          txn_date: normalizedDate,
          description: transaction.description || '',
          amount_cents: Math.abs(transaction.amount_cents) / 100,
          planned_payment_id: transaction.planned_payment_id ?? null,
          counterparty_user_id: transaction.counterparty_user_id ?? null,
        })
      } else {
        reset({
          user_id: userId,
          type: defaultType,
          account_id: defaultAccountId || (accounts.find(a => a.is_active)?.id as number | undefined),
          category_id: defaultCategoryId ?? null,
          pay_period_id: defaultPayPeriodId ?? null,
          txn_date: defaultDate || new Date().toISOString().split('T')[0],
          description: defaultDescription || '',
          amount_cents: undefined,
        })
      }
    }
  }, [
    isOpen,
    userId,
    defaultType,
    defaultAccountId,
    defaultCategoryId,
    defaultPayPeriodId,
    defaultDate,
    defaultDescription,
    accounts,
    transaction,
    reset,
  ])

  const onSubmit = async (data: FormData) => {
    try {
      setError(null)

      if (data.amount_cents === undefined || Number.isNaN(data.amount_cents)) {
        setError('Monto invalido')
        return
      }

      const normalizedCategoryId = data.category_id === 0 ? null : data.category_id
      const normalizedPayPeriodId = data.pay_period_id === 0 ? null : data.pay_period_id

      const normalizedAmount = Math.round(Math.abs(data.amount_cents) * 100)
      const amountCents = (data.type === 'expense' || data.type === 'transfer')
        ? normalizedAmount * -1
        : normalizedAmount

      if (transaction) {
        await transactionsApi.update(transaction.id, {
          user_id: userId,
          pay_period_id: normalizedPayPeriodId,
          account_id: data.account_id,
          category_id: normalizedCategoryId,
          type: data.type,
          amount_cents: amountCents,
          description: data.description,
          txn_date: data.txn_date,
          planned_payment_id: data.planned_payment_id,
          counterparty_user_id: data.counterparty_user_id,
        })
      } else {
        await transactionsApi.create({
          user_id: userId,
          pay_period_id: normalizedPayPeriodId,
          account_id: data.account_id,
          category_id: normalizedCategoryId,
          type: data.type,
          amount_cents: amountCents,
          description: data.description,
          txn_date: data.txn_date,
          planned_payment_id: data.planned_payment_id,
          counterparty_user_id: data.counterparty_user_id,
        })
      }

      onClose()
      reset()
      await onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : (transaction ? 'Error al actualizar transaccion' : 'Error al crear transaccion'))
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
        className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-gray-800">
              {isEditing ? 'Editar Transaccion' : 'Nueva Transaccion'}
            </h3>
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

          {/* Tipo - chips */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map((type) => {
                const isSelected = selectedType === type.value
                return (
                  <label
                    key={type.value}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-[#d821f9] bg-purple-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type.value}
                      {...register('type')}
                      className="hidden"
                    />
                    <div className={`w-7 h-7 rounded-full ${type.bg} flex items-center justify-center`}>
                      <type.Icon className={`w-3.5 h-3.5 ${type.color}`} />
                    </div>
                    <span className={`text-xs font-bold ${isSelected ? 'text-[#d821f9]' : 'text-gray-600'}`}>
                      {type.label}
                    </span>
                  </label>
                )
              })}
            </div>
            {errors.type && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.type.message}</p>
            )}
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Monto
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
              <input
                type="number"
                step="0.01"
                {...register('amount_cents', {
                  setValueAs: (v) => parseFloat(v),
                })}
                className="fintech-input w-full pl-8 pr-4 py-3 text-sm text-gray-800 font-semibold"
                placeholder="0.00"
              />
            </div>
            {errors.amount_cents && (
              <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.amount_cents.message}</p>
            )}
            <p className="mt-1 text-[11px] text-gray-400 font-medium">
              Ingresa el monto en dolares (ej: 25.50)
            </p>
          </div>

          {/* Cuenta y Fecha en grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Cuenta
              </label>
              <select
                {...register('account_id', { valueAsNumber: true })}
                className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
              >
                <option value="">Selecciona</option>
                {accounts.filter((a) => a.is_active).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
              {errors.account_id && (
                <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.account_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                {...register('txn_date')}
                className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
              />
              {errors.txn_date && (
                <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.txn_date.message}</p>
              )}
            </div>
          </div>

          {/* Categoria y Quincena en grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Categoria <span className="text-gray-300 normal-case">(opc.)</span>
              </label>
              <select
                {...register('category_id', {
                  setValueAs: (v) => (v === '' || v === 'null' ? null : Number(v)),
                })}
                className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
              >
                <option value="">Sin categoria</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Quincena <span className="text-gray-300 normal-case">(opc.)</span>
              </label>
              <select
                {...register('pay_period_id', {
                  setValueAs: (v) => (v === '' || v === 'null' ? null : Number(v)),
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
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
              Descripcion <span className="text-gray-300 normal-case">(opcional)</span>
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold resize-none"
              placeholder="Ej: Compra en supermercado"
            />
          </div>

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
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
