import { useEffect, useState } from 'react'
import { healthApi } from '../lib/api'

export function HealthBanner() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await healthApi.check()
        setIsOnline(true)
        setError(null)
      } catch (err) {
        setIsOnline(false)
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    }

    // Check immediately
    checkHealth()

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  if (isOnline === null) {
    return null // Loading, no mostramos nada
  }

  if (!isOnline) {
    return (
      <div className="bg-red-50/80 dark:bg-red-500/10 backdrop-blur-md border-l-4 border-red-500 p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div>
            <p className="text-[15px] font-semibold text-red-700 dark:text-red-300">
              Backend no disponible
            </p>
            <p className="text-[13px] text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null // Si todo está bien, no mostramos nada
}
