import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import AppShell from './components/AppShell'
import HomePage from './pages/HomePage'
import AccountsPage from './pages/AccountsPage'
import BillsPage from './pages/BillsPage'
import BudgetPage from './pages/BudgetPage'
import GoalsPage from './pages/GoalsPage'
import HelpPage from './pages/HelpPage'
import InvestmentsPage from './pages/InvestmentsPage'
import NotificationsPage from './pages/NotificationsPage'
import SettingsPage from './pages/SettingsPage'
import TransactionsPage from './pages/TransactionsPage'
import AIChatPage from './pages/AIChatPage'
import MarketPage from './pages/MarketPage'
import PortfolioPage from './pages/PortfolioPage'
import PredictionsPage from './pages/PredictionsPage'
import ExchangesPage from './pages/ExchangesPage'
import CommunityPage from './pages/CommunityPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import { useAuth } from './context/AuthContext'
import { Hexagon } from 'lucide-react'

// Layout wrapper: renders AppShell once, page content swaps via Outlet
function PrivateLayout({ fullBleed }: { fullBleed?: boolean }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-pulse flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20">
          <Hexagon size={32} className="text-lime-500" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppShell fullBleed={fullBleed}><Outlet /></AppShell>
}

// Redirect wrapper for auth pages (if logged in, go to home)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-pulse flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20">
          <Hexagon size={32} className="text-lime-500" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return children
  if (localStorage.getItem('finwise-onboarded') === 'false') return <Navigate to="/onboarding" replace />
  return <Navigate to="/" replace />
}

// Onboarding route: must be authenticated AND have finwise-onboarded='false'
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="animate-pulse flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20">
          <Hexagon size={32} className="text-lime-500" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (localStorage.getItem('finwise-onboarded') !== 'false') return <Navigate to="/" replace />
  return children
}

const router = createHashRouter([
  // Private routes — share a single AppShell layout
  {
    element: <PrivateLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/accounts', element: <AccountsPage /> },
      { path: '/bills', element: <BillsPage /> },
      { path: '/budget', element: <BudgetPage /> },
      { path: '/goals', element: <GoalsPage /> },
      { path: '/help', element: <HelpPage /> },
      { path: '/investments', element: <InvestmentsPage /> },
      { path: '/notifications', element: <NotificationsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/transactions', element: <TransactionsPage /> },
      { path: '/ai-chat', element: <AIChatPage /> },
      { path: '/market', element: <MarketPage /> },
      { path: '/portfolio', element: <PortfolioPage /> },
      { path: '/predictions', element: <PredictionsPage /> },
      { path: '/exchanges', element: <ExchangesPage /> },
    ],
  },
  // fullBleed layout (no padding in main content area)
  {
    element: <PrivateLayout fullBleed />,
    children: [
      { path: '/community', element: <CommunityPage /> },
    ],
  },

  // Public / Auth Routes
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
  { path: '/onboarding', element: <OnboardingRoute><OnboardingPage /></OnboardingRoute> },
])

export default function App() {
  return <RouterProvider router={router} />
}
