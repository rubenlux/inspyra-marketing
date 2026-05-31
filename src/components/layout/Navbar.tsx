import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap, Globe, LogIn } from 'lucide-react'
import { SITE } from '../../config/site'
import { useLang, type Lang } from '../../i18n'

export function Navbar() {
  const { lang, t, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const handleNav = (href: string) => {
    setOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const NAV_LINKS = [
    { label: t.nav.home, href: '#inicio' },
    { label: t.nav.services, href: '#servicios' },
    { label: t.nav.plans, href: '#planes' },
    { label: t.nav.process, href: '#proceso' },
    { label: t.nav.tech, href: '#tecnologia' },
    { label: t.nav.faq, href: '#faq' },
    { label: t.nav.contact, href: '#contacto' },
  ]

  const toggleLang = () => setLang(lang === 'es' ? 'en' : 'es')

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface-900/90 backdrop-blur-xl border-b border-white/[0.06] shadow-xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="container-max px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a
            href="#inicio"
            onClick={() => handleNav('#inicio')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">{SITE.name}</span>
              <span className="gradient-text ml-1">{SITE.tagline}</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNav(link.href)}
                className="px-3 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200 font-medium"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* CTA + Lang + Login + Hamburger */}
          <div className="flex items-center gap-2">
            {/* Lang toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200"
              title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'es' ? 'EN' : 'ES'}
            </button>

            {/* Login button */}
            <a
              href="/erp.html"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 glass rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              {t.nav.login}
            </a>

            <button
              onClick={() => handleNav('#contacto')}
              className="hidden sm:flex btn-primary text-sm px-5 py-2.5"
            >
              {t.nav.cta}
            </button>

            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 rounded-lg glass text-white/70 hover:text-white transition-colors"
              aria-label="Menú"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden bg-surface-800/95 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNav(link.href)}
                  className="px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-xl text-left transition-all font-medium"
                >
                  {link.label}
                </button>
              ))}
              <a
                href="/erp.html"
                className="flex items-center justify-center gap-2 mt-2 px-4 py-3 glass rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all border border-white/10"
              >
                <LogIn className="w-4 h-4" />
                {t.nav.login}
              </a>
              <button
                onClick={() => handleNav('#contacto')}
                className="mt-2 btn-primary justify-center"
              >
                {t.nav.cta}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
