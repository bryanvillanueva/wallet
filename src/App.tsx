import { useState } from 'react'
import { useAuthStore } from './stores/useAuthStore'
import { HealthBanner } from './components/HealthBanner'
import { Onboarding } from './screens/Onboarding'
import { Settings } from './screens/Settings'
import { Accounts } from './screens/Accounts'
import { Categories } from './screens/Categories'
import { PayPeriods } from './screens/PayPeriods'
import { Transactions } from './screens/Transactions'
import { Savings } from './screens/Savings'
import { SavingGoals } from './screens/SavingGoals'
import { Summary } from './screens/Summary'
import {
  BanknotesIcon,
  FlagIcon,
  ChartBarIcon,
  CreditCardIcon,
  CalendarIcon,
  WalletIcon,
  TagIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

type Screen = 'summary' | 'settings' | 'accounts' | 'categories' | 'payPeriods' | 'transactions' | 'savings' | 'goals'

function App() {
  const activeUserId = useAuthStore((state) => state.activeUserId)
  const [currentScreen, setCurrentScreen] = useState<Screen>('savings')

  // Si no hay usuario activo, mostrar Onboarding
  if (!activeUserId) {
    return <Onboarding />
  }

  // Renderizar pantalla actual
  const renderScreen = () => {
    switch (currentScreen) {
      case 'summary':
        return <Summary />
      case 'accounts':
        return <Accounts />
      case 'categories':
        return <Categories />
      case 'payPeriods':
        return <PayPeriods />
      case 'transactions':
        return <Transactions />
      case 'savings':
        return <Savings />
      case 'goals':
        return <SavingGoals />
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
        <div className="max-w-6xl mx-auto glass-card-light dark:glass-card-dark rounded-2xl p-2 flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setCurrentScreen('savings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'savings'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <BanknotesIcon className="w-5 h-5" />
            <span>Ahorros</span>
          </button>
          <button
            onClick={() => setCurrentScreen('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'goals'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <FlagIcon className="w-5 h-5" />
            <span>Metas</span>
          </button>
          <button
            onClick={() => setCurrentScreen('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'summary'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Resumen</span>
          </button>
          <button
            onClick={() => setCurrentScreen('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'transactions'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <CreditCardIcon className="w-5 h-5" />
            <span>Transacciones</span>
          </button>
          <button
            onClick={() => setCurrentScreen('payPeriods')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'payPeriods'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Quincenas</span>
          </button>
          <button
            onClick={() => setCurrentScreen('accounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'accounts'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <WalletIcon className="w-5 h-5" />
            <span>Cuentas</span>
          </button>
          <button
            onClick={() => setCurrentScreen('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'categories'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <TagIcon className="w-5 h-5" />
            <span>Categorías</span>
          </button>
          <button
            onClick={() => setCurrentScreen('settings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] md:text-[15px] font-medium transition-all duration-300 ${currentScreen === 'settings'
              ? 'bg-gradient-to-r from-[#22d3ee] to-[#06b6d4] dark:from-[#4da3ff] dark:to-[#3b82f6] text-white shadow-lg'
              : 'text-[#666] dark:text-neutral-400 hover:bg-white/20'
              }`}
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span>Ajustes</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      {renderScreen()}
    </div>
  )
}

export default App
