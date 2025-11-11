import { useState } from 'react'
import { useAuthStore } from './stores/useAuthStore'
import { HealthBanner } from './components/HealthBanner'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'
import { Accounts } from './screens/Accounts'

type Screen = 'settings' | 'accounts'

function App() {
  const activeUserId = useAuthStore((state) => state.activeUserId)
  const [currentScreen, setCurrentScreen] = useState<Screen>('settings')

  // Si no hay usuario activo, mostrar Onboarding
  if (!activeUserId) {
    return <Onboarding />
  }

  // Renderizar pantalla actual
  const renderScreen = () => {
    switch (currentScreen) {
      case 'accounts':
        return <Accounts />
      case 'settings':
      default:
        return <Settings />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-[#dbeafe] dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0c4a6e]">
      {/* Health Banner */}
      <div className="p-4">
        <HealthBanner />
      </div>

      {/* Navigation bar */}
      <div className="px-4 pb-4">
        <div className="max-w-4xl mx-auto glass-card-light dark:glass-card-dark rounded-2xl p-2 flex gap-2">
          <button
            onClick={() => setCurrentScreen('settings')}
            className={`flex-1 px-4 py-2 rounded-xl text-[15px] font-medium transition-all duration-300 ${
              currentScreen === 'settings'
                ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
                : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
            }`}
          >
            ⚙️ Ajustes
          </button>
          <button
            onClick={() => setCurrentScreen('accounts')}
            className={`flex-1 px-4 py-2 rounded-xl text-[15px] font-medium transition-all duration-300 ${
              currentScreen === 'accounts'
                ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
                : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
            }`}
          >
            🏦 Cuentas
          </button>
        </div>
      </div>

      {/* Main content */}
      {renderScreen()}
    </div>
  )
}

export default App
