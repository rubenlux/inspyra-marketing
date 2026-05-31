import { motion } from 'framer-motion'
import { CheckCircle2, Globe, Code2, Server, Cloud, Search, Share2 } from 'lucide-react'
import { SectionTitle } from '../ui/SectionTitle'
import { useLang } from '../../i18n'

const ICONS = [Globe, Code2, Server, Cloud, Search, Share2]
const COLORS = [
  { gradient: 'from-brand-500 to-brand-600', glow: 'shadow-brand-500/20' },
  { gradient: 'from-violet-500 to-violet-600', glow: 'shadow-violet-500/20' },
  { gradient: 'from-emerald-500 to-emerald-600', glow: 'shadow-emerald-500/20' },
  { gradient: 'from-orange-500 to-orange-600', glow: 'shadow-orange-500/20' },
  { gradient: 'from-accent-500 to-accent-600', glow: 'shadow-accent-500/20' },
  { gradient: 'from-pink-500 to-pink-600', glow: 'shadow-pink-500/20' },
]

export function Services() {
  const { t } = useLang()
  const s = t.services

  return (
    <section id="servicios" className="section-padding relative">
      <div className="absolute inset-0 bg-grid opacity-50 pointer-events-none" />
      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={s.eyebrow}
          title={s.title1}
          highlight={s.titleHighlight}
          subtitle={s.subtitle}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {s.items.map((service, i) => {
            const Icon = ICONS[i]
            const { gradient, glow } = COLORS[i]
            return (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="glass-dark rounded-2xl p-6 border border-white/[0.06] card-hover group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} mb-5`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-5">{service.description}</p>
                <ul className="space-y-1.5">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/70 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-white/50 mb-5 text-sm">{s.bottomText}</p>
          <a href="#contacto" className="btn-primary">{s.cta}</a>
        </motion.div>
      </div>
    </section>
  )
}
