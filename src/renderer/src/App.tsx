import { createHashRouter, RouterProvider, Navigate, Outlet, useRouteError, useNavigate } from 'react-router-dom'
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
import VerifyPage from './pages/VerifyPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import UnsubscribePage from './pages/UnsubscribePage'
import { useAuth } from './context/AuthContext'
import { Hexagon } from 'lucide-react'

function AuthLoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="animate-pulse flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20">
        <Hexagon size={32} className="text-lime-500" />
      </div>
    </div>
  )
}

// Layout wrapper: renders AppShell once, page content swaps via Outlet
function PrivateLayout({ fullBleed }: { fullBleed?: boolean }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <AppShell fullBleed={fullBleed}><Outlet /></AppShell>
}

// Redirect wrapper for auth pages (if logged in, go to home)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />
  if (!isAuthenticated) return children
  if (localStorage.getItem('finwise-onboarded') === 'false') return <Navigate to="/onboarding" replace />
  return <Navigate to="/" replace />
}

// Onboarding route: must be authenticated AND have finwise-onboarded='false'
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (localStorage.getItem('finwise-onboarded') !== 'false') return <Navigate to="/" replace />
  return children
}

// Route-level crash recovery: without this, a throw while rendering any page
// (a bad API response, a malformed record, a library error) unmounts the
// whole router with no way back short of a hard reload.
function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()
  console.error('Route render error:', error)

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20">
        <Hexagon size={32} className="text-lime-500" />
      </div>
      <div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 700 }}>This page hit an error</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          You can go back to the dashboard and try again.
        </p>
      </div>
      <button
        onClick={() => navigate('/', { replace: true })}
        className="px-4 py-2 rounded-lg text-sm font-medium"
        style={{ background: 'var(--accent-brand, #84cc16)', color: '#fff' }}
      >
        Back to Dashboard
      </button>
    </div>
  )
}

const router = createHashRouter([
  {
    errorElement: <RouteErrorBoundary />,
    children: [
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
      { path: '/verify', element: <VerifyPage /> },
      { path: '/forgot', element: <ForgotPasswordPage /> },
      { path: '/reset', element: <ResetPasswordPage /> },
      { path: '/unsubscribe', element: <UnsubscribePage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
