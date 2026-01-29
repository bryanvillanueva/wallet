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
import { MdBalance, MdSavings } from 'react-icons/md'

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
}
