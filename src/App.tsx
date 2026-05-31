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

function App() {
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

export default App
