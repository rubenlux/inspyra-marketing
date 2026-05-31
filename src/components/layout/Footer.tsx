import { Zap, MessageCircle, Mail, ArrowRight } from 'lucide-react'
import { SITE } from '../../config/site'
import { useLang } from '../../i18n'

export function Footer() {
  const { t } = useLang()
  const f = t.footer
  const year = new Date().getFullYear()

  const NAV_LINKS = [
    { label: t.nav.home, href: '#inicio' },
    { label: t.nav.services, href: '#servicios' },
    { label: t.nav.plans, href: '#planes' },
    { label: t.nav.process, href: '#proceso' },
    { label: t.nav.faq, href: '#faq' },
    { label: t.nav.contact, href: '#contacto' },
  ]

  const handleNav = (href: string) => {
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <footer className="relative bg-surface-800/50 border-t border-white/[0.05]">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* CTA band */}
      <div className="relative border-b border-white/[0.05]">
        <div className="container-max px-4 sm:px-6 lg:px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{f.ctaTitle}</h2>
          <p className="text-white/50 mb-7 max-w-xl mx-auto">{f.ctaSubtitle}</p>
          <a href="#contacto" onClick={() => handleNav('#contacto')} className="btn-primary">
            {f.ctaButton}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main */}
      <div className="container-max px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-bold">
                <span className="text-white">{SITE.name}</span>
                <span className="gradient-text ml-1">{SITE.tagline}</span>
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed mb-5">{f.description}</p>
            <div className="flex gap-3">
              <a href={SITE.contact.whatsappLink} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-emerald-500/15 hover:border-emerald-500/30 transition-all">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </a>
              <a href={SITE.contact.emailLink}
                className="w-9 h-9 glass rounded-lg flex items-center justify-center hover:bg-brand-500/15 hover:border-brand-500/30 transition-all">
                <Mail className="w-4 h-4 text-brand-400" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">{f.navTitle}</h4>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <button onClick={() => handleNav(link.href)} className="text-sm text-white/50 hover:text-white transition-colors">
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">{f.servicesTitle}</h4>
            <ul className="space-y-2.5">
              {f.services.map((s) => (
                <li key={s}>
                  <button onClick={() => handleNav('#servicios')} className="text-sm text-white/50 hover:text-white transition-colors text-left">
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">{f.contactTitle}</h4>
            <ul className="space-y-3">
              <li>
                <a href={SITE.contact.whatsappLink} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-white/50 hover:text-emerald-400 transition-colors flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {SITE.contact.whatsapp}
                </a>
              </li>
              <li>
                <a href={SITE.contact.emailLink}
                  className="text-sm text-white/50 hover:text-brand-400 transition-colors flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  {SITE.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.05] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <span>© {year} {SITE.name} {SITE.tagline}. {f.copyright}</span>
          <span>{SITE.claim}</span>
        </div>
      </div>
    </footer>
  )
}
