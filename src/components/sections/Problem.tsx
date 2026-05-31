import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'
import { SectionTitle } from '../ui/SectionTitle'
import { useLang } from '../../i18n'

export function Problem() {
  const { t } = useLang()
  const p = t.problem

  return (
    <section className="section-padding relative">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-800/30 to-surface-900 pointer-events-none" />
      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={p.eyebrow}
          title={p.title1}
          highlight={p.titleHighlight}
          subtitle={p.subtitle}
        />

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-dark rounded-2xl p-8 border border-white/[0.06]"
          >
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-6">
              {p.problemsLabel}
            </h3>
            <ul className="space-y-4">
              {p.problems.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/60">
                  <XCircle className="w-5 h-5 text-red-400/70 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-dark rounded-2xl p-8 border border-brand-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-600/10 rounded-full blur-2xl" />
            <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-widest mb-6 relative">
              {p.solutionsLabel}
            </h3>
            <ul className="space-y-4 relative">
              {p.solutions.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            {p.statement1}
            <span className="text-white font-semibold">{p.statementBold}</span>
            {p.statement2}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
