import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSavingGoalInputSchema, goalsApi, savingsApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import type { SavingGoal } from '../lib/api'

export function SavingGoals() {
  const { activeUserId } = useAuthStore()
  const { savingGoals, setSavingGoals, savingEntries, setSavingEntries } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal para asignar entradas
  const [assignModalGoal, setAssignModalGoal] = useState<SavingGoal | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<Set<number>>(new Set())

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
    if (!confirm('¿Estás seguro de eliminar esta meta?')) return

    try {
      setError(null)
      await goalsApi.delete(goalId)
      await loadAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar meta')
    }
  }

  const openAssignModal = (goal: SavingGoal) => {
    setAssignModalGoal(goal)
    // Pre-seleccionar entradas ya asignadas
    const assignedIds = goal.assigned_entry_ids ? goal.assigned_entry_ids.split(',').map(Number) : []
    setSelectedEntries(new Set(assignedIds))
  }

  const handleToggleEntry = (entryId: number) => {
    const newSet = new Set(selectedEntries)
    if (newSet.has(entryId)) {
      newSet.delete(entryId)
    } else {
      newSet.add(entryId)
    }
    setSelectedEntries(newSet)
  }

  const handleSaveAssignments = async () => {
    if (!assignModalGoal) return

    try {
      setError(null)

      // Obtener IDs actualmente asignados
      const currentIds = assignModalGoal.assigned_entry_ids
        ? assignModalGoal.assigned_entry_ids.split(',').map(Number)
        : []

      // Determinar qué entradas asignar y desasignar
      const toAssign = Array.from(selectedEntries).filter((id: number) => !currentIds.includes(id))
      const toUnassign = currentIds.filter((id: number) => !selectedEntries.has(id))

      // Ejecutar asignaciones y desasignaciones
      await Promise.all([
        ...toAssign.map((entryId: number) => goalsApi.assignEntryToGoal(entryId, assignModalGoal.id)),
        ...toUnassign.map((entryId: number) => goalsApi.unassignEntryFromGoal(entryId, assignModalGoal.id)),
      ])

      await loadAllData()
      setAssignModalGoal(null)
      setSelectedEntries(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar entradas')
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(cents / 100)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sin fecha límite'

    const dateToFormat = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`
    const date = new Date(dateToFormat)

    if (isNaN(date.getTime())) return 'Fecha inválida'

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

    // Calcular quincenas restantes (asumiendo 15 días por quincena)
    const payPeriodsRemaining = Math.ceil(daysRemaining / 15)

    if (payPeriodsRemaining <= 0) return null

    return remaining / payPeriodsRemaining
  }

  // Filtrar solo entradas de depósito (amount_cents > 0) para asignar
  const depositEntries = savingEntries.filter(e => e.amount_cents > 0)

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
          <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white">Metas de Ahorro</h1>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 glass-button rounded-2xl text-[13px] font-semibold text-[#22d3ee] dark:text-[#4da3ff]"
            >
              + Nueva Meta
            </button>
          )}
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Formulario de creación */}
        {showCreateForm && (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 mb-6">
            <h3 className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white mb-4">
              Nueva Meta de Ahorro
            </h3>

            <form onSubmit={handleSubmit(onCreateGoal)} className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Nombre de la Meta
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                  placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia"
                />
                {errors.name && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Monto objetivo */}
              <div>
                <label htmlFor="target_amount_cents" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Monto Objetivo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] dark:text-neutral-400 text-[15px]">
                    $
                  </span>
                  <input
                    id="target_amount_cents"
                    type="number"
                    step="0.01"
                    {...register('target_amount_cents', {
                      setValueAs: (v) => (v === '' || v === null ? 0 : Math.round(parseFloat(v) * 100)),
                    })}
                    className="glass-input w-full pl-8 pr-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                    placeholder="0.00"
                  />
                </div>
                {errors.target_amount_cents && (
                  <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                    {errors.target_amount_cents.message}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#666] dark:text-neutral-500">
                  Ingresa el monto objetivo en dólares (ej: 5000.00)
                </p>
              </div>

              {/* Fecha objetivo (opcional) */}
              <div>
                <label htmlFor="target_date" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                  Fecha Objetivo (opcional)
                </label>
                <input
                  id="target_date"
                  type="date"
                  {...register('target_date')}
                  className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                />
                <p className="mt-1 text-[11px] text-[#666] dark:text-neutral-500">
                  Si defines una fecha, te sugeriremos cuánto ahorrar por quincena
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
                  placeholder="Ej: Para viaje a Europa en verano"
                />
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
                  {isSubmitting ? 'Creando...' : 'Crear Meta'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de metas */}
        {savingGoals.length === 0 ? (
          <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
            <p className="text-[17px] font-medium text-[#1a1a1a] dark:text-white mb-2">
              No tienes metas de ahorro
            </p>
            <p className="text-[15px] text-[#666] dark:text-neutral-400 mb-4">
              Crea tu primera meta para comenzar a ahorrar con objetivo
            </p>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]"
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

              return (
                <div
                  key={goal.id}
                  className="glass-card-light dark:glass-card-dark rounded-2xl p-6"
                >
                  {/* Encabezado */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-[19px] font-bold text-[#1a1a1a] dark:text-white mb-1">
                        {goal.name}
                      </h3>
                      {goal.note && (
                        <p className="text-[13px] text-[#666] dark:text-neutral-400 mb-2">
                          {goal.note}
                        </p>
                      )}
                      <p className="text-[13px] text-[#666] dark:text-neutral-400">
                        Meta: {formatCurrency(goal.target_amount_cents)} · {formatDate(goal.target_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="px-3 py-1 glass-button rounded-full text-[13px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-[#666] dark:text-neutral-400">
                        Progreso
                      </span>
                      <span className={`text-[15px] font-bold ${
                        isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-[#22d3ee] dark:text-[#4da3ff]'
                      }`}>
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ease-out ${
                          isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6]'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="glass-card-light dark:glass-card-dark rounded-xl p-3">
                      <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-1">
                        Ahorrado
                      </p>
                      <p className="text-[17px] font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(goal.saved_cents || 0)}
                      </p>
                    </div>
                    <div className="glass-card-light dark:glass-card-dark rounded-xl p-3">
                      <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-1">
                        Restante
                      </p>
                      <p className="text-[17px] font-bold text-[#22d3ee] dark:text-[#4da3ff]">
                        {formatCurrency(goal.remaining_cents || goal.target_amount_cents)}
                      </p>
                    </div>
                  </div>

                  {/* Sugerencia de aporte */}
                  {suggestedContribution && !isCompleted && (
                    <div className="glass-card-light dark:glass-card-dark rounded-xl p-3 mb-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                      <p className="text-[11px] text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-1">
                        Aporte sugerido por quincena
                      </p>
                      <p className="text-[17px] font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(suggestedContribution)}
                      </p>
                    </div>
                  )}

                  {/* Mensaje de completado */}
                  {isCompleted && (
                    <div className="glass-card-light dark:glass-card-dark rounded-xl p-3 mb-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
                      <p className="text-[15px] font-semibold text-green-600 dark:text-green-400 text-center">
                        🎉 ¡Meta alcanzada!
                      </p>
                    </div>
                  )}

                  {/* Botón asignar entradas */}
                  <button
                    onClick={() => openAssignModal(goal)}
                    className="w-full px-4 py-2 glass-button rounded-2xl text-[13px] font-semibold text-[#22d3ee] dark:text-[#4da3ff] hover:bg-[#22d3ee]/10 transition-all"
                  >
                    📎 Asignar Aportes ({goal.assigned_entry_ids ? goal.assigned_entry_ids.split(',').length : 0})
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de asignación */}
        {assignModalGoal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h3 className="text-[19px] font-bold text-[#1a1a1a] dark:text-white mb-4">
                Asignar Aportes a: {assignModalGoal.name}
              </h3>

              {depositEntries.length === 0 ? (
                <p className="text-[15px] text-[#666] dark:text-neutral-400 mb-4">
                  No hay aportes disponibles para asignar
                </p>
              ) : (
                <div className="space-y-2 mb-6">
                  {depositEntries.map((entry) => (
                    <label
                      key={entry.id}
                      className="flex items-center gap-3 p-3 glass-card-light dark:glass-card-dark rounded-xl cursor-pointer hover:bg-white/30 dark:hover:bg-white/10 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEntries.has(entry.id)}
                        onChange={() => handleToggleEntry(entry.id)}
                        className="w-5 h-5 rounded accent-[#22d3ee]"
                      />
                      <div className="flex-1">
                        <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white">
                          {formatDate(entry.entry_date)}
                        </p>
                        {entry.note && (
                          <p className="text-[13px] text-[#666] dark:text-neutral-400">
                            {entry.note}
                          </p>
                        )}
                      </div>
                      <p className="text-[17px] font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(entry.amount_cents)}
                      </p>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAssignModalGoal(null)
                    setSelectedEntries(new Set())
                  }}
                  className="flex-1 px-4 py-3 glass-button rounded-2xl text-[15px] font-semibold text-[#555] dark:text-neutral-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAssignments}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)] hover:shadow-[0_12px_40px_rgba(34,211,238,0.6)] dark:hover:shadow-[0_12px_40px_rgba(77,163,255,0.6)] transition-all duration-300 ease-out hover:-translate-y-1"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
