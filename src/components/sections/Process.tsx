import { motion } from 'framer-motion'
import { SectionTitle } from '../ui/SectionTitle'
import { useLang } from '../../i18n'

const STEP_COLORS = [
  'from-brand-500 to-brand-600',
  'from-violet-500 to-violet-600',
  'from-accent-500 to-accent-600',
  'from-emerald-500 to-emerald-600',
  'from-orange-500 to-orange-600',
]

const STEP_NUMBERS = ['01', '02', '03', '04', '05']

export function Process() {
  const { t } = useLang()
  const p = t.process

  return (
    <section id="proceso" className="section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-800/20 to-surface-900 pointer-events-none" />
      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={p.eyebrow}
          title={p.title1}
          highlight={p.titleHighlight}
          subtitle={p.subtitle}
        />

        <div className="relative">
          <div className="absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent hidden lg:block" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {p.steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-dark rounded-2xl p-6 border border-white/[0.06] card-hover"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${STEP_COLORS[i]} flex items-center justify-center mb-5 shadow-lg`}>
                  <span className="text-white font-bold text-lg">{STEP_NUMBERS[i]}</span>
                </div>
                <h3 className="font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
