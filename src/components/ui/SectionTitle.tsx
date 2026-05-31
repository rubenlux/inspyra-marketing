import { motion } from 'framer-motion'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  highlight?: string
  subtitle?: string
  centered?: boolean
}

export function SectionTitle({ eyebrow, title, highlight, subtitle, centered = true }: SectionTitleProps) {
  const parts = highlight ? title.split(highlight) : [title]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-14 ${centered ? 'text-center' : ''}`}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-accent-400 mb-4 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight text-balance">
        {parts[0]}
        {highlight && <span className="gradient-text">{highlight}</span>}
        {parts[1]}
      </h2>
      {subtitle && (
        <p className={`mt-5 text-lg text-white/60 leading-relaxed max-w-2xl text-balance ${centered ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
