import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  LoginInputSchema,
  RegisterInputSchema,
  authApi,
  type LoginInput,
  type RegisterInput,
} from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { Icons } from '../components/Icons'
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'

type AuthMode = 'login' | 'register'

export function Onboarding() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuthStore()

  // Login form
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(LoginInputSchema),
  })

  // Register form
  const registerForm = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
  })

  const onLogin = async (data: LoginInput) => {
    try {
      setError(null)
      const res = await authApi.login(data)
      login(res.token, res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion')
    }
  }

  const onRegister = async (data: RegisterInput) => {
    try {
      setError(null)
      const res = await authApi.register(data)
      login(res.token, res.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    }
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setShowPassword(false)
    loginForm.reset()
    registerForm.reset()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#d821f9] to-[#7a0fa8] flex flex-col items-center justify-center px-5 py-10">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icons.PiggyBank className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-white text-2xl font-extrabold tracking-tight">Wallet</h1>
          <p className="text-white/50 text-xs font-semibold">Gestiona tus finanzas</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Mode toggle */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              mode === 'login'
                ? 'text-[#d821f9] border-b-2 border-[#d821f9]'
                : 'text-gray-400'
            }`}
          >
            Iniciar Sesion
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              mode === 'register'
                ? 'text-[#d821f9] border-b-2 border-[#d821f9]'
                : 'text-gray-400'
            }`}
          >
            Registrarse
          </button>
        </div>

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* ===== LOGIN FORM ===== */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300" />
                  <input
                    type="email"
                    {...loginForm.register('email')}
                    className="fintech-input w-full pl-10 pr-4 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="tu@email.com"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...loginForm.register('password')}
                    className="fintech-input w-full pl-10 pr-10 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4.5 h-4.5 text-gray-400" />
                    ) : (
                      <EyeIcon className="w-4.5 h-4.5 text-gray-400" />
                    )}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loginForm.formState.isSubmitting}
                className="w-full py-3.5 fintech-btn-primary text-sm font-bold mt-2"
              >
                {loginForm.formState.isSubmitting ? 'Ingresando...' : 'Iniciar Sesion'}
              </button>
            </form>
          )}

          {/* ===== REGISTER FORM ===== */}
          {mode === 'register' && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Nombre
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300" />
                  <input
                    type="text"
                    {...registerForm.register('name')}
                    className="fintech-input w-full pl-10 pr-4 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="Tu nombre"
                  />
                </div>
                {registerForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300" />
                  <input
                    type="email"
                    {...registerForm.register('email')}
                    className="fintech-input w-full pl-10 pr-4 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="tu@email.com"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...registerForm.register('password')}
                    className="fintech-input w-full pl-10 pr-10 py-3 text-sm text-gray-800 font-semibold"
                    placeholder="Minimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4.5 h-4.5 text-gray-400" />
                    ) : (
                      <EyeIcon className="w-4.5 h-4.5 text-gray-400" />
                    )}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-semibold">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
                className="w-full py-3.5 fintech-btn-primary text-sm font-bold mt-2"
              >
                {registerForm.formState.isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-white/30 text-xs font-semibold">Wallet App v0.1.0</p>
    </div>
  )
}
