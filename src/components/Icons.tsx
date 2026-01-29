// CircumIcons from react-icons
import {
  CiMoneyBill,
  CiWallet,
  CiBank,
  CiReceipt,
  CiStar,
  CiBarcode,
  CiCalendar,
  CiSettings,
  CiGrid41,
  CiSaveDown2,
  CiCircleList,
  CiCreditCard1,
  CiRepeat,
} from 'react-icons/ci'
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi'
import { GoGoal } from 'react-icons/go'
import {
  MdBalance,
  MdSavings,
  MdFlight,
  MdDirectionsCar,
  MdLaptopMac,
  MdHome,
  MdShield,
  MdFavorite,
  MdSchool,
  MdPhoneIphone,
  MdFlag,
  MdDelete,
  MdCheckCircle,
  MdLink,
  MdShoppingCart,
  MdSportsEsports,
  MdPets,
  MdCelebration,
} from 'react-icons/md'
import type { IconType } from 'react-icons'

export const Icons = {
  // Finanzas
  TrendingUp: HiTrendingUp,
  TrendingDown: HiTrendingDown,
  DollarCircle: CiMoneyBill,
  Wallet: CiWallet,
  CreditCard: CiCreditCard1,
  PiggyBank: MdSavings,

  // Navegación y UI
  Chart: CiGrid41,
  Calendar: CiCalendar,
  Tag: CiBarcode,
  Settings: CiSettings,
  Target: GoGoal,
  Clipboard: CiCircleList,
  Receipt: CiReceipt,
  Bank: CiBank,
  Sparkles: CiStar,
  Savings: CiSaveDown2,
  Transfer: CiRepeat,
  Balance: MdBalance,

  // Iconos de metas
  Flight: MdFlight,
  Car: MdDirectionsCar,
  Laptop: MdLaptopMac,
  Home: MdHome,
  Shield: MdShield,
  Heart: MdFavorite,
  School: MdSchool,
  Phone: MdPhoneIphone,
  Flag: MdFlag,
  Delete: MdDelete,
  CheckCircle: MdCheckCircle,
  Link: MdLink,
  ShoppingCart: MdShoppingCart,
  Gaming: MdSportsEsports,
  Pet: MdPets,
  Celebration: MdCelebration,
}

// ============================================================
// Auto-detección de icono y color por nombre de meta
// ============================================================

type GoalIconConfig = {
  icon: IconType
  bg: string    // clase tailwind bg del circulo
  color: string // clase tailwind text del icono
}

const GOAL_CATEGORIES: { keywords: string[]; config: GoalIconConfig }[] = [
  {
    keywords: ['vacacion', 'viaje', 'playa', 'vuelo', 'avion', 'europa', 'travel', 'turismo', 'pasaje'],
    config: { icon: MdFlight, bg: 'bg-sky-100', color: 'text-sky-500' },
  },
  {
    keywords: ['auto', 'carro', 'coche', 'moto', 'vehiculo', 'camioneta', 'car'],
    config: { icon: MdDirectionsCar, bg: 'bg-orange-100', color: 'text-orange-500' },
  },
  {
    keywords: ['laptop', 'computador', 'pc', 'tech', 'macbook', 'ipad', 'tablet'],
    config: { icon: MdLaptopMac, bg: 'bg-indigo-100', color: 'text-indigo-500' },
  },
  {
    keywords: ['telefono', 'celular', 'iphone', 'samsung', 'phone', 'movil'],
    config: { icon: MdPhoneIphone, bg: 'bg-violet-100', color: 'text-violet-500' },
  },
  {
    keywords: ['casa', 'hogar', 'departamento', 'apartamento', 'renta', 'hipoteca', 'arriendo', 'piso'],
    config: { icon: MdHome, bg: 'bg-amber-100', color: 'text-amber-600' },
  },
  {
    keywords: ['emergencia', 'seguro', 'fondo', 'reserva', 'imprevisto', 'colchon'],
    config: { icon: MdShield, bg: 'bg-red-100', color: 'text-red-500' },
  },
  {
    keywords: ['salud', 'medico', 'doctor', 'hospital', 'clinica', 'dental', 'operacion'],
    config: { icon: MdFavorite, bg: 'bg-pink-100', color: 'text-pink-500' },
  },
  {
    keywords: ['universidad', 'estudio', 'curso', 'master', 'carrera', 'educacion', 'escuela', 'diplomado', 'certificacion'],
    config: { icon: MdSchool, bg: 'bg-teal-100', color: 'text-teal-500' },
  },
  {
    keywords: ['compra', 'shopping', 'regalo', 'navidad', 'cumpleano'],
    config: { icon: MdShoppingCart, bg: 'bg-fuchsia-100', color: 'text-fuchsia-500' },
  },
  {
    keywords: ['juego', 'gaming', 'consola', 'playstation', 'xbox', 'nintendo', 'switch', 'ps5'],
    config: { icon: MdSportsEsports, bg: 'bg-cyan-100', color: 'text-cyan-500' },
  },
  {
    keywords: ['mascota', 'perro', 'gato', 'veterinari'],
    config: { icon: MdPets, bg: 'bg-lime-100', color: 'text-lime-600' },
  },
  {
    keywords: ['boda', 'matrimonio', 'fiesta', 'celebracion', 'evento'],
    config: { icon: MdCelebration, bg: 'bg-yellow-100', color: 'text-yellow-500' },
  },
]

const DEFAULT_CONFIG: GoalIconConfig = {
  icon: GoGoal,
  bg: 'bg-purple-100',
  color: 'text-[#d821f9]',
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
}

export function getGoalIconConfig(goalName: string): GoalIconConfig {
  const name = normalize(goalName)
  for (const category of GOAL_CATEGORIES) {
    if (category.keywords.some((kw) => name.includes(kw))) {
      return category.config
    }
  }
  return DEFAULT_CONFIG
}
