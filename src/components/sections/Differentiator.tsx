import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Zap } from 'lucide-react'
import { SectionTitle } from '../ui/SectionTitle'
import { useLang } from '../../i18n'

export function Differentiator() {
  const { t } = useLang()
  const d = t.differentiator

  return (
    <section className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-900 via-surface-800/20 to-surface-900 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={d.eyebrow}
          title={d.title1}
          highlight={d.titleHighlight}
          subtitle={d.subtitle}
        />

        <div className="grid lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-dark rounded-2xl p-8 border border-white/[0.05]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-bold text-white/60">{d.traditionalLabel}</h3>
            </div>
            <ul className="space-y-3">
              {d.traditional.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/40 text-sm">
                  <XCircle className="w-4 h-4 text-red-400/50 flex-shrink-0 mt-0.5" />
                  <span className="line-through decoration-white/20">{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="glass-dark rounded-2xl p-8 border border-brand-500/25 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-white">{d.inspyraLabel}</h3>
            </div>
            <ul className="space-y-3 relative">
              {d.inspyra.map((item) => (
                <li key={item} className="flex items-start gap-3 text-white/80 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
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
          className="mt-14 glass-dark rounded-2xl p-8 border border-accent-500/15 max-w-3xl mx-auto text-center"
        >
          <p className="text-lg text-white/80 leading-relaxed italic">{d.quote}</p>
        </motion.div>
      </div>
    </section>
  )
}
