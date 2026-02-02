import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ChangePasswordInputSchema,
  authApi,
  type ChangePasswordInput,
} from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import {
  UserCircleIcon,
  LockClosedIcon,
  ArrowRightStartOnRectangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'

export function Settings() {
  const { user, logout } = useAuthStore()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInputSchema),
  })

  const onChangePassword = async (data: ChangePasswordInput) => {
    try {
      setError(null)
      setPasswordSuccess(false)
      await authApi.changePassword(data)
      setPasswordSuccess(true)
      reset()
      setTimeout(() => {
        setShowPasswordForm(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar contraseña')
    }
  }

  const handleLogout = () => {
    if (confirm('¿Seguro que quieres cerrar sesion?')) {
      logout()
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ============ HEADER PURPLE ============ */}
      <div className="bg-gradient-to-br from-[#d821f9] to-[#a018c0] px-6 pt-8 pb-28 rounded-b-[32px]">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/70 text-sm font-semibold mb-1">Tu cuenta</p>
              <h1 className="text-white text-2xl font-extrabold">Configuracion</h1>
            </div>
          </div>

          {/* User info in header */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-xl font-extrabold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white text-lg font-extrabold">{user.name}</p>
                <p className="text-white/60 text-sm font-semibold">{user.email}</p>
              </div>
            </div>
          )}
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

        {/* Profile card */}
        {user && (
          <div className="fintech-card p-5 mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
              Perfil
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-5 h-5 text-[#d821f9]" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Nombre</p>
                  <p className="text-sm font-bold text-gray-800">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-5 h-5 text-[#d821f9]" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Email</p>
                  <p className="text-sm font-bold text-gray-800">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserCircleIcon className="w-5 h-5 text-[#d821f9]" />
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Rol</p>
                  <p className="text-sm font-bold text-gray-800 capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="fintech-card overflow-hidden mb-4">
          {/* Change password */}
          <button
            onClick={() => {
              setShowPasswordForm(!showPasswordForm)
              setError(null)
              setPasswordSuccess(false)
              reset()
              setShowCurrentPw(false)
              setShowNewPw(false)
            }}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <LockClosedIcon className="w-4.5 h-4.5 text-[#d821f9]" />
              </div>
              <span className="text-sm font-bold text-gray-800">Cambiar contraseña</span>
            </div>
            <ChevronRightIcon className={`w-4 h-4 text-gray-400 transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
          </button>

          {/* Password form (expandable) */}
          {showPasswordForm && (
            <div className="px-5 pb-4 border-t border-gray-100">
              {passwordSuccess ? (
                <div className="flex items-center gap-2 py-4">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <p className="text-sm font-bold text-green-600">Contraseña actualizada</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onChangePassword)} className="pt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Contraseña actual
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPw ? 'text' : 'password'}
                        {...register('current_password')}
                        className="fintech-input w-full px-4 py-2.5 pr-10 text-sm text-gray-800 font-semibold"
                        placeholder="Tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showCurrentPw ? (
                          <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.current_password && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">{errors.current_password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                      Nueva contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? 'text' : 'password'}
                        {...register('new_password')}
                        className="fintech-input w-full px-4 py-2.5 pr-10 text-sm text-gray-800 font-semibold"
                        placeholder="Minimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        {showNewPw ? (
                          <EyeSlashIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {errors.new_password && (
                      <p className="mt-1 text-xs text-red-500 font-semibold">{errors.new_password.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="flex-1 py-2.5 fintech-btn-secondary text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 fintech-btn-primary text-xs"
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <ArrowRightStartOnRectangleIcon className="w-4.5 h-4.5 text-red-500" />
            </div>
            <span className="text-sm font-bold text-red-500">Cerrar sesion</span>
          </button>
        </div>

        {/* App info */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400 font-semibold">Wallet App v0.1.0</p>
        </div>
      </div>
    </div>
  )
}
