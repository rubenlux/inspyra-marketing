import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Globe, Server, Cloud, Search, Share2, Code2 } from 'lucide-react'
import { useLang } from '../../i18n'

const FLOATING_CARDS = [
  { icon: Globe, label: 'Web', color: 'from-brand-500 to-brand-600' },
  { icon: Server, label: 'VPS', color: 'from-emerald-500 to-emerald-600' },
  { icon: Cloud, label: 'AWS', color: 'from-orange-500 to-orange-600' },
  { icon: Search, label: 'SEO', color: 'from-accent-500 to-accent-600' },
  { icon: Share2, label: 'Social', color: 'from-pink-500 to-pink-600' },
  { icon: Code2, label: 'App', color: 'from-violet-500 to-violet-600' },
]

const METRIC_COLORS = ['text-brand-400', 'text-emerald-400', 'text-accent-400']

export function Hero() {
  const { t } = useLang()
  const h = t.hero

  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute inset-0 bg-radial-hero" />
      <div className="absolute inset-0 bg-radial-accent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-max section-padding relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-white/70 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {h.badge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.1] text-balance mb-6"
            >
              {h.title1}
              <span className="gradient-text">{h.titleHighlight}</span>
              {h.title2}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-white/60 leading-relaxed mb-8 max-w-xl"
            >
              {h.subtitle}
              <span className="text-white/80 font-medium">{h.subtitleBold}</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <a href="#contacto" className="btn-primary">
                {h.ctaPrimary}
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#servicios" className="btn-secondary">
                {h.ctaSecondary}
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-2"
            >
              {h.badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center gap-1.5 text-xs text-white/60 glass px-3 py-1.5 rounded-full"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  {badge}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="glass-dark rounded-2xl p-6 border border-white/[0.08] shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs text-white/30 font-mono">{h.dashboardLabel}</span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {h.metrics.map((m, i) => (
                  <div key={m.label} className="bg-white/[0.04] rounded-xl p-3 text-center border border-white/[0.06]">
                    <div className={`text-xl font-bold ${METRIC_COLORS[i]}`}>{m.value}</div>
                    <div className="text-xs text-white/40 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Cards */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {FLOATING_CARDS.map(({ icon: Icon, label, color }) => (
                  <div
                    key={label}
                    className="bg-white/[0.04] rounded-xl p-3 flex flex-col items-center gap-2 border border-white/[0.06] hover:bg-white/[0.07] transition-colors cursor-default"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-white/60 font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="space-y-2">
                {h.statusItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <span className="text-xs text-white/50">{item.label}</span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -inset-4 bg-brand-600/10 rounded-3xl blur-2xl -z-10" />
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-900 to-transparent pointer-events-none" />
    </section>
  )
}
