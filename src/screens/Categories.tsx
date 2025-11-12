import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateCategoryInputSchema, categoriesApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'

const CATEGORY_KINDS: Array<{
  value: 'income' | 'expense' | 'transfer' | 'adjustment'
  label: string
  icon: string
  color: string
}> = [
  { value: 'income', label: 'Ingreso', icon: '💰', color: 'text-green-600 dark:text-green-400' },
  { value: 'expense', label: 'Gasto', icon: '💸', color: 'text-red-600 dark:text-red-400' },
  { value: 'transfer', label: 'Transferencia', icon: '🔄', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'adjustment', label: 'Ajuste', icon: '⚖️', color: 'text-yellow-600 dark:text-yellow-400' },
]

export function Categories() {
  const { activeUserId } = useAuthStore()
  const { categories, setCategories } = useWalletStore()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  type FormData = {
    user_id?: number | null
    name: string
    kind: 'income' | 'expense' | 'transfer' | 'adjustment'
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(CreateCategoryInputSchema),
    defaultValues: {
      user_id: activeUserId,
    },
  })

  useEffect(() => {
    if (activeUserId) {
      loadCategories()
    }
  }, [activeUserId])

  const loadCategories = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const data = await categoriesApi.list(activeUserId)
      setCategories(data)
    } catch (err) {
      console.error('Error loading categories:', err)
      setError(err instanceof Error ? err.message : 'Error al cargar categorías')
    } finally {
      setIsLoading(false)
    }
  }

  const onCreateCategory = async (data: FormData) => {
    try {
      setError(null)
      await categoriesApi.create({
        user_id: activeUserId,
        name: data.name,
        kind: data.kind,
      })

      await loadCategories()
      reset()
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría')
    }
  }

  const getCategoryKindInfo = (kind: string) => {
    return CATEGORY_KINDS.find((k) => k.value === kind) || CATEGORY_KINDS[0]
  }

  // Separar categorías globales y personales
  const globalCategories = categories.filter((c) => c.user_id === null)
  const personalCategories = categories.filter((c) => c.user_id !== null)

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
        <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-8">Categorías</h1>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 backdrop-filter backdrop-blur-xl border border-red-400/50 rounded-2xl">
            <p className="text-[13px] text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Categorías Globales */}
        {globalCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-4">
              Categorías Globales
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {globalCategories.map((category) => {
                const kindInfo = getCategoryKindInfo(category.kind)
                return (
                  <div
                    key={category.id}
                    className="glass-card-light dark:glass-card-dark rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{kindInfo.icon}</span>
                      <div>
                        <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white">
                          {category.name}
                        </p>
                        <p className={`text-[13px] font-medium ${kindInfo.color}`}>
                          {kindInfo.label}
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-white/20 dark:bg-white/10 rounded-full">
                      <p className="text-[11px] font-medium text-[#666] dark:text-neutral-400">
                        Global
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Categorías Personales */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider">
              Mis Categorías
            </h2>
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 glass-button rounded-2xl text-[13px] font-semibold text-[#22d3ee] dark:text-[#4da3ff]"
              >
                + Nueva
              </button>
            )}
          </div>

          {personalCategories.length === 0 && !showCreateForm && (
            <div className="glass-card-light dark:glass-card-dark rounded-2xl p-8 text-center">
              <p className="text-[15px] text-[#666] dark:text-neutral-400">
                No tienes categorías personales aún
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-2xl text-[15px] font-semibold text-white shadow-[0_8px_30px_rgba(34,211,238,0.4)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.4)]"
              >
                Crear primera categoría
              </button>
            </div>
          )}

          {personalCategories.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {personalCategories.map((category) => {
                const kindInfo = getCategoryKindInfo(category.kind)
                return (
                  <div
                    key={category.id}
                    className="glass-card-light dark:glass-card-dark rounded-2xl p-4 flex items-center gap-3"
                  >
                    <span className="text-2xl">{kindInfo.icon}</span>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-[#1a1a1a] dark:text-white">
                        {category.name}
                      </p>
                      <p className={`text-[13px] font-medium ${kindInfo.color}`}>
                        {kindInfo.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Formulario de creación */}
          {showCreateForm && (
            <div className="glass-card-light dark:glass-card-dark rounded-2xl p-6 mb-6">
              <h3 className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white mb-4">
                Nueva Categoría Personal
              </h3>

              <form onSubmit={handleSubmit(onCreateCategory)} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label htmlFor="name" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Nombre
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] placeholder-[#999] dark:placeholder-neutral-400 focus:outline-none transition-all duration-300"
                    placeholder="Ej: Suscripciones, Comida, etc."
                  />
                  {errors.name && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Tipo */}
                <div>
                  <label htmlFor="kind" className="block text-[13px] font-medium text-[#555] dark:text-neutral-300 mb-2">
                    Tipo
                  </label>
                  <select
                    id="kind"
                    {...register('kind')}
                    className="glass-input w-full px-4 py-3 rounded-2xl text-[#1a1a1a] dark:text-white text-[15px] focus:outline-none transition-all duration-300"
                  >
                    {CATEGORY_KINDS.map((kind) => (
                      <option key={kind.value} value={kind.value}>
                        {kind.icon} {kind.label}
                      </option>
                    ))}
                  </select>
                  {errors.kind && (
                    <p className="mt-2 text-[13px] text-red-600 dark:text-red-400 font-medium">
                      {errors.kind.message}
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
                    {isSubmitting ? 'Creando...' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
