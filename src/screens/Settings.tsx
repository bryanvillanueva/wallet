import { useState, useEffect } from 'react'
import { usersApi, type User } from '../lib/api'
import { useAuthStore } from '../stores/useAuthStore'
import { LoadingBar } from '../components/LoadingBar'

export function Settings() {
  const { activeUserId, setActiveUserId, clearActiveUser } = useAuthStore()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (activeUserId) {
      loadCurrentUser()
    } else {
      setIsLoading(false)
    }
  }, [activeUserId])

  const loadCurrentUser = async () => {
    if (!activeUserId) return

    try {
      setIsLoading(true)
      const user = await usersApi.getById(activeUserId)
      setCurrentUser(user)
    } catch (err) {
      console.error('Error loading user:', err)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      clearActiveUser()
      setCurrentUser(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <LoadingBar />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-8">Configuración</h1>

        {/* Usuario actual */}
        {currentUser && (
          <div className="glass-card-light dark:glass-card-dark rounded-3xl p-6 mb-6">
            <h2 className="text-[13px] font-medium text-[#666] dark:text-neutral-400 uppercase tracking-wider mb-4">
              Usuario Actual
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[17px] font-semibold text-[#1a1a1a] dark:text-white">{currentUser.name}</p>
                {currentUser.email && (
                  <p className="text-[15px] text-[#666] dark:text-neutral-300 mt-1">{currentUser.email}</p>
                )}
                <p className="text-[13px] text-[#999] dark:text-neutral-500 mt-2">ID: {currentUser.id}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(34,211,238,0.5)] dark:shadow-[0_8px_30px_rgba(77,163,255,0.5)]">
                <span className="text-2xl font-bold text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Opciones */}
        <div className="space-y-3">
          {/* Cambiar usuario */}
          <button
            onClick={handleLogout}
            className="w-full p-4 glass-button rounded-2xl text-left flex items-center justify-between transition-all duration-300 ease-out hover:-translate-y-1"
          >
            <span className="text-[15px] font-medium text-[#1a1a1a] dark:text-white">Cambiar de usuario</span>
            <svg
              className="w-5 h-5 text-[#666] dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {/* Export (placeholder para fase futura) */}
          <button
            disabled
            className="w-full p-4 glass-button rounded-2xl text-left flex items-center justify-between opacity-40 cursor-not-allowed"
          >
            <span className="text-[15px] font-medium text-[#1a1a1a] dark:text-white">Exportar datos</span>
            <svg
              className="w-5 h-5 text-[#666] dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

          {/* Import (placeholder para fase futura) */}
          <button
            disabled
            className="w-full p-4 glass-button rounded-2xl text-left flex items-center justify-between opacity-40 cursor-not-allowed"
          >
            <span className="text-[15px] font-medium text-[#1a1a1a] dark:text-white">Importar datos</span>
            <svg
              className="w-5 h-5 text-[#666] dark:text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-[#999] dark:text-neutral-500">Wallet App v0.1.0</p>
          <p className="text-[13px] text-[#aaa] dark:text-neutral-600 mt-1">Glassmorphism Design</p>
        </div>
      </div>
    </div>
  )
}
