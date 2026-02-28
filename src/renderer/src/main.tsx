import React, { Suspense, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { FinanceProvider } from './context/FinanceContext'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './globals.css'

const SplashScreen = React.lazy(() => import('./components/SplashScreen'))

function Root() {
  const [splashDone, setSplashDone] = useState(false)
  return (
    <AuthProvider>
      <FinanceProvider>
        {splashDone ? (
          <App />
        ) : (
          <Suspense fallback={null}>
            <SplashScreen onDone={() => setSplashDone(true)} />
          </Suspense>
        )}
      </FinanceProvider>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
