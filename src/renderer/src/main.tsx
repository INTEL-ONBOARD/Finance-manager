import React, { Suspense, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { FinanceProvider } from './context/FinanceContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import App from './App'
import './globals.css'

const SplashScreen = React.lazy(() => import('./components/SplashScreen'))

function AppWithFinance() {
  const { user } = useAuth()
  const [splashDone, setSplashDone] = useState(false)
  return (
    <FinanceProvider userId={user?.id ?? null}>
      {splashDone ? (
        <App />
      ) : (
        <Suspense fallback={null}>
          <SplashScreen onDone={() => setSplashDone(true)} />
        </Suspense>
      )}
    </FinanceProvider>
  )
}

function Root() {
  return (
    <AuthProvider>
      <AppWithFinance />
    </AuthProvider>
  )
}

// Preserve the root across Vite HMR reloads to prevent double-createRoot crashes
const container = document.getElementById('root')!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let root = (container as any).__reactRoot
if (!root) {
  root = ReactDOM.createRoot(container);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (container as any).__reactRoot = root
}
root.render(<Root />)
