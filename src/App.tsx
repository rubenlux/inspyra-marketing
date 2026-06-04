import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Hero } from './components/sections/Hero'
import { Problem } from './components/sections/Problem'
import { Services } from './components/sections/Services'
import { Differentiator } from './components/sections/Differentiator'
import { Plans } from './components/sections/Plans'
import { Process } from './components/sections/Process'
import { Tech } from './components/sections/Tech'
import { FAQ } from './components/sections/FAQ'
import { Contact } from './components/sections/Contact'

const ERPPrototype = lazy(() => import('./erp/ERPPrototype'))
const LoginPage = lazy(() => import('./pages/LoginPage'))

function MarketingHome() {
  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Services />
        <Differentiator />
        <Plans />
        <Process />
        <Tech />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHome />} />
      <Route path="/login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
      <Route path="/erp" element={<Navigate to="/erp/dashboard" replace />} />
      <Route
        path="/erp/*"
        element={
          <Suspense fallback={<div className="min-h-screen bg-surface-900 text-white" />}>
            <ERPPrototype />
          </Suspense>
        }
      />
    </Routes>
  )
}

export default App
