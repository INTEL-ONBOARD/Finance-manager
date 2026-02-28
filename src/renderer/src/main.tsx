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
        <Suspense fallback={null}>
          {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
        </Suspense>
        <App />
      </FinanceProvider>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
