import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageCircle, Mail, CheckCircle2 } from 'lucide-react'
import { SITE } from '../../config/site'
import { SectionTitle } from '../ui/SectionTitle'
import { useLang } from '../../i18n'

interface FormData {
  name: string; company: string; email: string; whatsapp: string
  service: string; budget: string; message: string
}
const EMPTY: FormData = { name: '', company: '', email: '', whatsapp: '', service: '', budget: '', message: '' }

export function Contact() {
  const { t } = useLang()
  const c = t.contact
  const [form, setForm] = useState<FormData>(EMPTY)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: reemplazar por llamada real al backend Node.js
    await new Promise((r) => setTimeout(r, 1200))
    setLoading(false)
    setSent(true)
    setForm(EMPTY)
  }

  const inputClass =
    'w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-brand-500/60 focus:bg-white/[0.07] transition-all duration-200'

  return (
    <section id="contacto" className="section-padding relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-hero pointer-events-none" />
      <div className="container-max relative z-10">
        <SectionTitle
          eyebrow={c.eyebrow}
          title={c.title1}
          highlight={c.titleHighlight}
          subtitle={c.subtitle}
        />

        <div className="grid lg:grid-cols-5 gap-12 items-start max-w-5xl mx-auto">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 space-y-6"
          >
            <div>
              <h3 className="font-bold text-white mb-3 text-lg">{c.directTitle}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{c.directSubtitle}</p>
            </div>

            <a href={SITE.contact.whatsappLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 glass-dark rounded-xl p-4 border border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20 flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-white/40 mb-0.5">WhatsApp</div>
                <div className="text-sm font-medium text-white">{SITE.contact.whatsapp}</div>
              </div>
            </a>

            <a href={SITE.contact.emailLink}
              className="flex items-center gap-4 glass-dark rounded-xl p-4 border border-white/[0.06] hover:border-brand-500/30 hover:bg-brand-500/5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center border border-brand-500/20 flex-shrink-0">
                <Mail className="w-5 h-5 text-brand-400" />
              </div>
              <div>
                <div className="text-xs text-white/40 mb-0.5">Email</div>
                <div className="text-sm font-medium text-white">{SITE.contact.email}</div>
              </div>
            </a>

            <div className="glass-dark rounded-xl p-5 border border-white/[0.06]">
              <h4 className="text-sm font-semibold text-white mb-3">{c.diagnosisTitle}</h4>
              <ul className="space-y-2">
                {c.diagnosisItems.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-white/55">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-3"
          >
            {sent ? (
              <div className="glass-dark rounded-2xl p-10 border border-emerald-500/25 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{c.successTitle}</h3>
                <p className="text-white/55 text-sm">{c.successText}</p>
                <button onClick={() => setSent(false)} className="mt-6 btn-secondary text-sm px-5 py-2.5">
                  {c.successBack}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-dark rounded-2xl p-8 border border-white/[0.06] space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">{c.fields.name}</label>
                    <input name="name" required value={form.name} onChange={handleChange} placeholder={c.fields.namePlaceholder} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">{c.fields.company}</label>
                    <input name="company" value={form.company} onChange={handleChange} placeholder={c.fields.companyPlaceholder} className={inputClass} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">{c.fields.email}</label>
                    <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder={c.fields.emailPlaceholder} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">{c.fields.whatsapp}</label>
                    <input name="whatsapp" value={form.whatsapp} onChange={handleChange} placeholder={c.fields.whatsappPlaceholder} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">{c.fields.service}</label>
                  <select name="service" value={form.service} onChange={handleChange} className={inputClass}>
                    <option value="">{c.fields.servicePlaceholder}</option>
                    {c.serviceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">{c.fields.budget}</label>
                  <select name="budget" value={form.budget} onChange={handleChange} className={inputClass}>
                    <option value="">{c.fields.budgetPlaceholder}</option>
                    {c.budgetOptions.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">{c.fields.message}</label>
                  <textarea name="message" required rows={4} value={form.message} onChange={handleChange} placeholder={c.fields.messagePlaceholder} className={`${inputClass} resize-none`} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {c.sending}
                    </span>
                  ) : (
                    <><Send className="w-4 h-4" />{c.submit}</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
