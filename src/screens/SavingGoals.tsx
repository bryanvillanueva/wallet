import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSavingGoalInputSchema, goalsApi, savingsApi } from '../lib/api'
import type { EntryAllocations } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import { Icons, getGoalIconConfig } from '../components/Icons'
import {
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import type { SavingGoal } from '../lib/api'

export function SavingGoals() {
  const { activeUserId } = useAuthStore()
  const { savingGoals, setSavingGoals, savingEntries, setSavingEntries } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal para asignar entradas
  const [assignModalGoal, setAssignModalGoal] = useState<SavingGoal | null>(null)
  const [entryAllocations, setEntryAllocations] = useState<Map<number, EntryAllocations>>(new Map())
  const [assignAmounts, setAssignAmounts] = useState<Map<number, string>>(new Map())
  const [loadingAllocations, setLoadingAllocations] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(CreateSavingGoalInputSchema),
    defaultValues: {
      user_id: activeUserId || 0,
      name: '',
      target_amount_cents: 0,
      target_date: null,
      note: null,
    },
  })

  useEffect(() => {
    if (activeUserId) {
      loadAllData()
    }
  }, [activeUserId])

  const loadAllData = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const [goalsData, entriesData] = await Promise.all([
        goalsApi.listByUser(activeUserId),
        savingsApi.listEntries({ userId: activeUserId }),
      ])
      setSavingGoals(goalsData)
      setSavingEntries(entriesData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateGoal = async (data: any) => {
    try {
      setError(null)
      await goalsApi.create({
        user_id: activeUserId!,
        name: data.name,
        target_amount_cents: data.target_amount_cents,
        target_date: data.target_date || null,
        note: data.note || null,
      })

      await loadAllData()
      reset({
        user_id: activeUserId || 0,
        name: '',
        target_amount_cents: 0,
        target_date: null,
        note: null,
      })
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear meta')
    }
  }

  const handleDeleteGoal = async (goalId: number) => {
    if (!confirm('Estas seguro de eliminar esta meta?')) return

    try {
      setError(null)
      await goalsApi.delete(goalId)
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar meta')
    }
  }

  // Filtrar solo entradas de depósito (amount_cents > 0) para asignar
  const depositEntries = savingEntries.filter(e => e.amount_cents > 0)

  const openAssignModal = async (goal: SavingGoal) => {
    setAssignModalGoal(goal)
    setAssignAmounts(new Map())
    setLoadingAllocations(true)

    try {
      const allocationsMap = new Map<number, EntryAllocations>()
      const results = await Promise.all(
        depositEntries.map((entry) => goalsApi.getEntryAllocations(entry.id))
      )
      results.forEach((alloc) => {
        allocationsMap.set(alloc.entry_id, alloc)
      })
      setEntryAllocations(allocationsMap)
    } catch (err) {
      console.error('Error loading allocations:', err)
    } finally {
      setLoadingAllocations(false)
    }
  }

  const getEntryAllocationForGoal = (entryId: number, goalId: number) => {
    const alloc = entryAllocations.get(entryId)
    if (!alloc) return null
    return alloc.allocations.find((a) => a.goal_id === goalId) || null
  }

  const handleAssignEntry = async (entryId: number) => {
    if (!assignModalGoal) return

    try {
      setError(null)
      const amountStr = assignAmounts.get(entryId)
      const amountCents = amountStr ? Math.round(parseFloat(amountStr) * 100) : undefined
      await goalsApi.assignEntryToGoal(entryId, assignModalGoal.id, amountCents)

      const updated = await goalsApi.getEntryAllocations(entryId)
      setEntryAllocations((prev) => new Map(prev).set(entryId, updated))
      setAssignAmounts((prev) => {
        const next = new Map(prev)
        next.delete(entryId)
        return next
      })
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar entrada')
    }
  }

  const handleUnassignEntry = async (entryId: number) => {
    if (!assignModalGoal) return

    try {
      setError(null)
      await goalsApi.unassignEntryFromGoal(entryId, assignModalGoal.id)

      const updated = await goalsApi.getEntryAllocations(entryId)
      setEntryAllocations((prev) => new Map(prev).set(entryId, updated))
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desasignar entrada')
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(cents / 100)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha limite'

    const dateToFormat = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const date = new Date(dateToFormat)

    if (isNaN(date.getTime())) return 'Fecha invalida'

    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const calculateProgress = (goal: SavingGoal) => {
    const saved = goal.saved_cents || 0
    const target = goal.target_amount_cents
    return Math.min((saved / target) * 100, 100)
  }

  const calculateSuggestedContribution = (goal: SavingGoal) => {
    const remaining = goal.remaining_cents || goal.target_amount_cents

    if (!goal.target_date || remaining <= 0) return null

    const today = new Date()
    const targetDate = new Date(goal.target_date)
    const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysRemaining <= 0) return null

    const payPeriodsRemaining = Math.ceil(daysRemaining / 15)

    if (payPeriodsRemaining <= 0) return null

    return remaining / payPeriodsRemaining
  }

  // Resumen general
  const totalTarget = savingGoals.reduce((sum, g) => sum + g.target_amount_cents, 0)
  const totalSaved = savingGoals.reduce((sum, g) => sum + (g.saved_cents || 0), 0)
  const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0
  const completedGoals = savingGoals.filter(g => calculateProgress(g) >= 100).length

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
          <p className="text-white/70 text-sm font-semibold mb-1">Planifica tu futuro</p>
          <h1 className="text-white text-2xl font-extrabold mb-6">Metas de Ahorro</h1>

          {/* Progreso general */}
          {savingGoals.length > 0 && (
            <div>
              <div className="flex items-end justify-between mb-2">
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                  Progreso General
                </p>
                <p className="text-white text-xl font-black">
                  {overallProgress.toFixed(0)}%
                </p>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out bg-white"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-white/50 text-xs font-semibold">
                  {formatCurrency(totalSaved)} de {formatCurrency(totalTarget)}
                </p>
                <p className="text-white/50 text-xs font-semibold">
                  {completedGoals}/{savingGoals.length} completadas
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ CONTENT ============ */}
      <div className="max-w-lg mx-auto px-5 -mt-16 pb-8">
        {/* Resumen cards */}
        {savingGoals.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="fintech-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
                <Icons.Target className="w-5 h-5 text-[#d821f9]" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">Metas</p>
                <p className="text-[16px] font-extrabold text-gray-800">{savingGoals.length}</p>
              </div>
            </div>
            <div className="fintech-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase">Logradas</p>
                <p className="text-[16px] font-extrabold text-gray-800">{completedGoals}</p>
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

        {/* Boton nueva meta */}
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 fintech-btn-primary text-[15px] mb-5"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Meta
          </button>
        )}

        {/* ============ FORMULARIO ============ */}
        {showCreateForm && (
          <div className="fintech-card p-5 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-gray-800">Nueva Meta</h3>
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

            <form onSubmit={handleSubmit(onCreateGoal)} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nombre de la Meta
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                  placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia"
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.name.message}</p>
                )}
              </div>

              {/* Monto objetivo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Monto Objetivo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('target_amount_cents', {
                      setValueAs: (v) => (v === '' || v === null ? 0 : Math.round(parseFloat(v) * 100)),
                    })}
                    className="fintech-input w-full pl-8 pr-4 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="0.00"
                  />
                </div>
                {errors.target_amount_cents && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.target_amount_cents.message}</p>
                )}
                <p className="mt-1 text-[11px] text-gray-400 font-medium">
                  Ingresa el monto en dolares (ej: 5000.00)
                </p>
              </div>

              {/* Fecha objetivo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Fecha Objetivo <span className="text-gray-300 normal-case">(opcional)</span>
                </label>
                <input
                  type="date"
                  {...register('target_date')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                />
                <p className="mt-1 text-[11px] text-gray-400 font-medium">
                  Si defines una fecha, te sugeriremos cuanto ahorrar por quincena
                </p>
              </div>

              {/* Nota */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nota <span className="text-gray-300 normal-case">(opcional)</span>
                </label>
                <textarea
                  {...register('note')}
                  rows={2}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold resize-none"
                  placeholder="Ej: Para viaje a Europa en verano"
                />
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
                  {isSubmitting ? 'Creando...' : 'Crear Meta'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============ LISTA DE METAS ============ */}
        {savingGoals.length === 0 ? (
          <div className="fintech-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Icons.Target className="w-8 h-8 text-[#d821f9]" />
            </div>
            <p className="text-base font-bold text-gray-800 mb-1">Sin metas de ahorro</p>
            <p className="text-sm text-gray-400 mb-5">
              Crea tu primera meta para comenzar a ahorrar con objetivo
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 fintech-btn-primary text-sm"
              >
                Crear Primera Meta
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {savingGoals.map((goal) => {
              const progress = calculateProgress(goal)
              const suggestedContribution = calculateSuggestedContribution(goal)
              const isCompleted = progress >= 100
              const iconConfig = getGoalIconConfig(goal.name)
              const GoalIcon = iconConfig.icon

              return (
                <div key={goal.id} className="fintech-card overflow-hidden">
                  {/* Card header con icono */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Icono auto-detectado */}
                      <div className={`w-12 h-12 rounded-2xl ${iconConfig.bg} flex items-center justify-center shrink-0`}>
                        <GoalIcon className={`w-6 h-6 ${iconConfig.color}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-base font-extrabold text-gray-800 truncate">
                              {goal.name}
                            </h3>
                            {goal.note && (
                              <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                                {goal.note}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center shrink-0 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4 text-gray-300 hover:text-red-400" />
                          </button>
                        </div>

                        {/* Meta info */}
                        <p className="text-xs text-gray-400 font-semibold mt-1">
                          {formatDate(goal.target_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progreso */}
                  <div className="px-5 pb-4">
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="text-xl font-black text-gray-800">
                          {formatCurrency(goal.saved_cents || 0)}
                        </p>
                        <p className="text-xs text-gray-400 font-semibold">
                          de {formatCurrency(goal.target_amount_cents)}
                        </p>
                      </div>
                      <span className={`text-sm font-extrabold px-2.5 py-1 rounded-full ${
                        isCompleted
                          ? 'bg-green-50 text-green-500'
                          : 'bg-purple-50 text-[#d821f9]'
                      }`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>

                    {/* Barra de progreso moderna */}
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                            : 'bg-gradient-to-r from-[#d821f9] to-[#a018c0]'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Sugerencia de aporte */}
                  {suggestedContribution && !isCompleted && (
                    <div className="mx-5 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[11px] text-amber-600/70 font-bold uppercase">Aporte sugerido / quincena</p>
                          <p className="text-sm font-extrabold text-amber-600">
                            {formatCurrency(suggestedContribution)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mensaje de completado */}
                  {isCompleted && (
                    <div className="mx-5 mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />
                      <p className="text-sm font-bold text-green-600">Meta alcanzada</p>
                    </div>
                  )}

                  {/* Botón asignar aportes */}
                  <div className="px-5 pb-5">
                    <button
                      onClick={() => openAssignModal(goal)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#d821f9] bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Asignar Aportes
                      {goal.assigned_entry_ids && (
                        <span className="text-xs bg-[#d821f9] text-white px-2 py-0.5 rounded-full font-bold">
                          {goal.assigned_entry_ids.split(',').length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ============ MODAL ASIGNACION ============ */}
        {assignModalGoal && (
          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center"
            onClick={() => {
              setAssignModalGoal(null)
              setEntryAllocations(new Map())
              setAssignAmounts(new Map())
            }}
          >
            <div
              className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Modal header */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const ic = getGoalIconConfig(assignModalGoal.name)
                      const ModalIcon = ic.icon
                      return (
                        <div className={`w-10 h-10 rounded-xl ${ic.bg} flex items-center justify-center`}>
                          <ModalIcon className={`w-5 h-5 ${ic.color}`} />
                        </div>
                      )
                    })()}
                    <div>
                      <h3 className="text-base font-extrabold text-gray-800">
                        {assignModalGoal.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-semibold">
                        Asignar aportes a esta meta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAssignModalGoal(null)
                      setEntryAllocations(new Map())
                      setAssignAmounts(new Map())
                    }}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {loadingAllocations ? (
                  <LoadingBar />
                ) : depositEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Icons.PiggyBank className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-500">No hay aportes disponibles</p>
                    <p className="text-xs text-gray-400 mt-1">Registra un deposito primero</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {depositEntries.map((entry) => {
                      const alloc = entryAllocations.get(entry.id)
                      const unassigned = alloc ? alloc.unassigned_cents : entry.amount_cents
                      const assignedToThis = getEntryAllocationForGoal(entry.id, assignModalGoal.id)
                      const isAssigned = !!assignedToThis

                      return (
                        <div
                          key={entry.id}
                          className={`p-4 rounded-xl border transition-colors ${
                            isAssigned
                              ? 'border-[#d821f9]/30 bg-purple-50/50'
                              : 'border-gray-100 bg-white'
                          }`}
                        >
                          {/* Entry info */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                <Icons.TrendingUp className="w-4 h-4 text-green-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-800">
                                  {formatDate(entry.entry_date)}
                                </p>
                                {entry.note && (
                                  <p className="text-xs text-gray-400 font-medium">{entry.note}</p>
                                )}
                              </div>
                            </div>
                            <p className="text-base font-extrabold text-green-500">
                              {formatCurrency(entry.amount_cents)}
                            </p>
                          </div>

                          {/* Allocations existentes */}
                          {alloc && alloc.allocations.length > 0 && (
                            <div className="mb-2 ml-12 space-y-0.5">
                              {alloc.allocations.map((a) => (
                                <p key={a.goal_id} className={`text-[11px] font-semibold ${
                                  a.goal_id === assignModalGoal.id
                                    ? 'text-[#d821f9]'
                                    : 'text-gray-400'
                                }`}>
                                  {a.goal_name}: {formatCurrency(a.amount_cents)}
                                </p>
                              ))}
                              <p className="text-[11px] text-gray-300 font-semibold">
                                Disponible: {formatCurrency(unassigned)}
                              </p>
                            </div>
                          )}

                          {/* Acciones */}
                          {isAssigned ? (
                            <div className="flex items-center justify-between ml-12">
                              <div className="flex items-center gap-1.5">
                                <CheckCircleIcon className="w-4 h-4 text-[#d821f9]" />
                                <p className="text-xs font-bold text-[#d821f9]">
                                  Asignado: {formatCurrency(assignedToThis.amount_cents)}
                                </p>
                              </div>
                              <button
                                onClick={() => handleUnassignEntry(entry.id)}
                                className="px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                Quitar
                              </button>
                            </div>
                          ) : unassigned > 0 ? (
                            <div className="flex items-center gap-2 ml-12">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={assignAmounts.get(entry.id) || ''}
                                  onChange={(e) => {
                                    setAssignAmounts((prev) => new Map(prev).set(entry.id, e.target.value))
                                  }}
                                  placeholder={`Max ${(unassigned / 100).toFixed(2)}`}
                                  className="fintech-input w-full pl-7 pr-3 py-2 text-xs text-gray-800 font-semibold"
                                />
                              </div>
                              <button
                                onClick={() => handleAssignEntry(entry.id)}
                                className="px-4 py-2 fintech-btn-primary text-xs whitespace-nowrap"
                              >
                                Asignar
                              </button>
                            </div>
                          ) : (
                            <p className="text-[11px] text-gray-300 font-semibold ml-12 italic">
                              Sin monto disponible
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setAssignModalGoal(null)
                    setEntryAllocations(new Map())
                    setAssignAmounts(new Map())
                  }}
                  className="w-full py-3 fintech-btn-secondary text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
