import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
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
import { useAuth } from './context/AuthContext'
import { Hexagon } from 'lucide-react'

// Private route wrapper
function PrivateRoute({ children }: { children: React.ReactNode }) {
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

  return isAuthenticated ? children : <Navigate to="/login" replace />
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

  return !isAuthenticated ? children : <Navigate to="/" replace />
}

const router = createHashRouter([
  // Private / Main App Routes
  { path: '/', element: <PrivateRoute><HomePage /></PrivateRoute> },
  { path: '/accounts', element: <PrivateRoute><AccountsPage /></PrivateRoute> },
  { path: '/bills', element: <PrivateRoute><BillsPage /></PrivateRoute> },
  { path: '/budget', element: <PrivateRoute><BudgetPage /></PrivateRoute> },
  { path: '/goals', element: <PrivateRoute><GoalsPage /></PrivateRoute> },
  { path: '/help', element: <PrivateRoute><HelpPage /></PrivateRoute> },
  { path: '/investments', element: <PrivateRoute><InvestmentsPage /></PrivateRoute> },
  { path: '/notifications', element: <PrivateRoute><NotificationsPage /></PrivateRoute> },
  { path: '/settings', element: <PrivateRoute><SettingsPage /></PrivateRoute> },
  { path: '/transactions', element: <PrivateRoute><TransactionsPage /></PrivateRoute> },
  { path: '/ai-chat', element: <PrivateRoute><AIChatPage /></PrivateRoute> },
  { path: '/market', element: <PrivateRoute><MarketPage /></PrivateRoute> },
  { path: '/portfolio', element: <PrivateRoute><PortfolioPage /></PrivateRoute> },
  { path: '/predictions', element: <PrivateRoute><PredictionsPage /></PrivateRoute> },
  { path: '/exchanges', element: <PrivateRoute><ExchangesPage /></PrivateRoute> },
  { path: '/community', element: <PrivateRoute><CommunityPage /></PrivateRoute> },

  // Public / Auth Routes
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
])

export default function App() {
  return <RouterProvider router={router} />
}
