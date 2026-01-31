import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateCategoryInputSchema, categoriesApi } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { useWalletStore } from '../stores/useWalletStore'
import { LoadingBar } from '../components/LoadingBar'
import {
  PlusIcon,
  XMarkIcon,
  BanknotesIcon,
  ArrowDownCircleIcon,
  ArrowPathIcon,
  ScaleIcon,
  TagIcon,
} from '@heroicons/react/24/outline'

const CATEGORY_KINDS: Array<{
  value: 'income' | 'expense' | 'transfer' | 'adjustment'
  label: string
  Icon: React.ElementType
  color: string
  bg: string
}> = [
  { value: 'income', label: 'Ingreso', Icon: BanknotesIcon, color: 'text-green-600', bg: 'bg-green-50' },
  { value: 'expense', label: 'Gasto', Icon: ArrowDownCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
  { value: 'transfer', label: 'Transferencia', Icon: ArrowPathIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'adjustment', label: 'Ajuste', Icon: ScaleIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
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
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(CreateCategoryInputSchema),
    defaultValues: {
      user_id: activeUserId,
    },
  })

  const selectedKind = watch('kind')

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
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm font-semibold mb-1">Organizacion</p>
              <h1 className="text-white text-2xl font-extrabold">Categorias</h1>
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
                Globales
              </p>
              <p className="text-white text-2xl font-black">
                {globalCategories.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">
                Personales
              </p>
              <p className="text-white text-2xl font-black">
                {personalCategories.length}
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

        {/* Categorías Globales */}
        {globalCategories.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-white uppercase tracking-wide mb-3">
              Categorias Globales
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {globalCategories.map((category) => {
                const kindInfo = getCategoryKindInfo(category.kind)
                return (
                  <div
                    key={category.id}
                    className="fintech-card p-4 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${kindInfo.bg} flex items-center justify-center shrink-0`}>
                      <kindInfo.Icon className={`w-5 h-5 ${kindInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-800 truncate">
                        {category.name}
                      </p>
                      <p className={`text-xs font-medium ${kindInfo.color}`}>
                        {kindInfo.label}
                      </p>
                    </div>
                    <div className="px-2.5 py-1 bg-gray-100 rounded-full shrink-0">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
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
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Mis Categorias
          </p>

          {personalCategories.length === 0 ? (
            <div className="fintech-card p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                <TagIcon className="w-7 h-7 text-[#d821f9]" />
              </div>
              <p className="text-base font-bold text-gray-800 mb-1">
                No tienes categorias personales
              </p>
              <p className="text-sm text-gray-400 mb-5">
                Crea tu primera categoria para organizar mejor
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-5 py-2.5 fintech-btn-primary text-sm"
              >
                Crear Primera Categoria
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {personalCategories.map((category) => {
                const kindInfo = getCategoryKindInfo(category.kind)
                return (
                  <div
                    key={category.id}
                    className="fintech-card p-4 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${kindInfo.bg} flex items-center justify-center shrink-0`}>
                      <kindInfo.Icon className={`w-5 h-5 ${kindInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-gray-800 truncate">
                        {category.name}
                      </p>
                      <p className={`text-xs font-medium ${kindInfo.color}`}>
                        {kindInfo.label}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ============ MODAL NUEVA CATEGORIA ============ */}
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
                    <TagIcon className="w-5 h-5 text-[#d821f9]" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-800">Nueva Categoria</h3>
                    <p className="text-xs text-gray-400 font-semibold">Categoria personal</p>
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

            <form onSubmit={handleSubmit(onCreateCategory)} className="px-5 py-4 space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nombre de la categoria
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className="fintech-input w-full px-4 py-3 text-sm text-gray-800 font-semibold"
                  placeholder="Ej: Suscripciones, Comida, etc."
                />
                {errors.name && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.name.message}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Tipo de categoria
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_KINDS.map((kind) => (
                    <label
                      key={kind.value}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedKind === kind.value
                          ? 'border-[#d821f9] bg-purple-50/50'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        value={kind.value}
                        {...register('kind')}
                        className="sr-only"
                      />
                      <kind.Icon className={`w-5 h-5 ${
                        selectedKind === kind.value ? 'text-[#d821f9]' : 'text-gray-400'
                      }`} />
                      <span className={`text-sm font-semibold ${
                        selectedKind === kind.value ? 'text-[#d821f9]' : 'text-gray-600'
                      }`}>
                        {kind.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.kind && (
                  <p className="mt-1.5 text-xs text-red-500 font-semibold">{errors.kind.message}</p>
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
                  {isSubmitting ? 'Creando...' : 'Crear categoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
