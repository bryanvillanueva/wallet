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
import { Icons } from './components/Icons'
import {
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type Screen = 'summary' | 'settings' | 'accounts' | 'categories' | 'payPeriods' | 'transactions' | 'savings' | 'goals'

// Tabs principales (bottom bar en mobile)
const primaryTabs: { key: Screen; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'savings', label: 'Ahorros', Icon: Icons.PiggyBank },
  { key: 'goals', label: 'Metas', Icon: Icons.Target },
  { key: 'transactions', label: 'Movimientos', Icon: Icons.CreditCard },
  { key: 'summary', label: 'Resumen', Icon: Icons.Chart },
]

// Tabs secundarios (dentro de "Mas")
const secondaryTabs: { key: Screen; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'payPeriods', label: 'Quincenas', Icon: Icons.Calendar },
  { key: 'accounts', label: 'Cuentas', Icon: Icons.Wallet },
  { key: 'categories', label: 'Categorias', Icon: Icons.Tag },
  { key: 'settings', label: 'Ajustes', Icon: Cog6ToothIcon },
]

function App() {
  const activeUserId = useAuthStore((state) => state.activeUserId)
  const [currentScreen, setCurrentScreen] = useState<Screen>('savings')
  const [showMore, setShowMore] = useState(false)

  if (!activeUserId) {
    return <Onboarding />
  }

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

  const isSecondaryActive = secondaryTabs.some((t) => t.key === currentScreen)

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* ============ DESKTOP TOP NAV ============ */}
      <nav className="hidden md:block sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <HealthBanner />
        <div className="max-w-5xl mx-auto px-4 flex items-center h-14 gap-1">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2 mr-6">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#d821f9] to-[#a018c0] flex items-center justify-center">
              <Icons.PiggyBank className="w-5 h-5 text-white" />
            </div>
            <span className="text-base font-extrabold text-gray-800">Wallet</span>
          </div>

          {/* Primary tabs */}
          {primaryTabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentScreen(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                currentScreen === key
                  ? 'bg-[#d821f9]/10 text-[#d821f9]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </button>
          ))}

          {/* Separator */}
          <div className="w-px h-6 bg-gray-200 mx-2" />

          {/* Secondary tabs */}
          {secondaryTabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setCurrentScreen(key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                currentScreen === key
                  ? 'bg-[#d821f9]/10 text-[#d821f9]'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <main className="pb-24 md:pb-6">
        {renderScreen()}
      </main>

      {/* ============ MOBILE BOTTOM TAB BAR ============ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40">
        {/* Tab bar */}
        <div className="bg-white border-t border-gray-100 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around h-16">
            {primaryTabs.map(({ key, label, Icon }) => {
              const isActive = currentScreen === key
              return (
                <button
                  key={key}
                  onClick={() => { setCurrentScreen(key); setShowMore(false) }}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 pt-2"
                >
                  <div className={`transition-all ${isActive ? 'scale-110' : ''}`}>
                    <Icon className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-[#d821f9]' : 'text-gray-300'
                    }`} />
                  </div>
                  <span className={`text-[10px] font-bold transition-colors ${
                    isActive ? 'text-[#d821f9]' : 'text-gray-300'
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="w-1 h-1 rounded-full bg-[#d821f9] mt-0.5" />
                  )}
                </button>
              )
            })}

            {/* Boton "Mas" */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 pt-2"
            >
              <div className={`transition-all ${showMore || isSecondaryActive ? 'scale-110' : ''}`}>
                <EllipsisHorizontalIcon className={`w-6 h-6 transition-colors ${
                  showMore || isSecondaryActive ? 'text-[#d821f9]' : 'text-gray-300'
                }`} />
              </div>
              <span className={`text-[10px] font-bold transition-colors ${
                showMore || isSecondaryActive ? 'text-[#d821f9]' : 'text-gray-300'
              }`}>
                Mas
              </span>
              {isSecondaryActive && !showMore && (
                <div className="w-1 h-1 rounded-full bg-[#d821f9] mt-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ============ MOBILE "MAS" BOTTOM SHEET ============ */}
      {showMore && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-50"
            onClick={() => setShowMore(false)}
          />

          {/* Sheet */}
          <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3">
              <h3 className="text-lg font-extrabold text-gray-800">Mas opciones</h3>
              <button
                onClick={() => setShowMore(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Grid de opciones */}
            <div className="grid grid-cols-4 gap-2 px-5 pb-6">
              {secondaryTabs.map(({ key, label, Icon }) => {
                const isActive = currentScreen === key
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setCurrentScreen(key)
                      setShowMore(false)
                    }}
                    className="flex flex-col items-center gap-2 py-4 rounded-2xl transition-all active:scale-95"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-[#d821f9] shadow-lg shadow-[#d821f9]/30'
                        : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <span className={`text-xs font-bold ${
                      isActive ? 'text-[#d821f9]' : 'text-gray-500'
                    }`}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
