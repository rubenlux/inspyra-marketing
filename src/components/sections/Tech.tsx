import { motion } from 'framer-motion'
import { SectionTitle } from '../ui/SectionTitle'
import { TECH_STACK } from '../../config/tech'
import { useLang } from '../../i18n'

const SOLUTION_ICONS = ['👤', '🏢', '🛒', '⚙️', '📊', '🎯', '🔐', '☁️']

const CATEGORY_COLORS: Record<string, string> = {
  frontend: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
  backend: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  cms: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  database: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  cloud: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  infra: 'text-accent-400 bg-accent-500/10 border-accent-500/20',
  security: 'text-red-400 bg-red-500/10 border-red-500/20',
  marketing: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

export function Tech() {
  const { t } = useLang()
  const tech = t.tech

  return (
    <section id="tecnologia" className="section-padding relative">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={tech.eyebrow}
          title={tech.title1}
          highlight={tech.titleHighlight}
          subtitle={tech.subtitle}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-24"
        >
          {TECH_STACK.map((item) => (
            <span
              key={item.name}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border ${CATEGORY_COLORS[item.category]} transition-all duration-200 hover:-translate-y-0.5 cursor-default`}
            >
              {item.name}
            </span>
          ))}
        </motion.div>

        <SectionTitle
          eyebrow={tech.solutionsEyebrow}
          title={tech.solutionsTitle1}
          highlight={tech.solutionsHighlight}
          subtitle={tech.solutionsSubtitle}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tech.solutions.map((sol, i) => (
            <motion.div
              key={sol.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="glass-dark rounded-2xl p-5 border border-white/[0.06] card-hover"
            >
              <div className="text-3xl mb-3">{SOLUTION_ICONS[i]}</div>
              <h3 className="font-bold text-white text-sm mb-1.5">{sol.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed">{sol.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
