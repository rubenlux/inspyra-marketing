import { motion } from 'framer-motion'
import { CheckCircle2, Star } from 'lucide-react'
import { SectionTitle } from '../ui/SectionTitle'
import { useLang } from '../../i18n'

export function Plans() {
  const { t } = useLang()
  const p = t.plans

  return (
    <section id="planes" className="section-padding relative">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={p.eyebrow}
          title={p.title1}
          highlight={p.titleHighlight}
          subtitle={p.subtitle}
        />

        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {p.items.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 flex flex-col border card-hover ${
                plan.highlight
                  ? 'bg-gradient-to-b from-brand-600/20 to-brand-900/20 border-brand-500/40 shadow-xl shadow-brand-600/10'
                  : 'glass-dark border-white/[0.06]'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg shadow-brand-500/30">
                    <Star className="w-3 h-3" fill="currentColor" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-1">{plan.price}</div>
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-white/90'}`}>
                  {plan.name}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">{plan.description}</p>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/65">
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-brand-400' : 'text-emerald-400/70'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#contacto"
                className={`block text-center py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-accent-500 text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5'
                    : 'glass text-white hover:bg-white/10 hover:-translate-y-0.5'
                }`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-white/30 mt-8"
        >
          {p.disclaimer}
        </motion.p>
      </div>
    </section>
  )
}
