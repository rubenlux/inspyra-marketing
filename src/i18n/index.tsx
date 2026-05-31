import { createContext, useContext, useState, type ReactNode } from 'react'
import { es } from './es'
import { en } from './en'
import type { Translations } from './es'

export type Lang = 'es' | 'en'

const translations: Record<Lang, Translations> = { es, en }

interface LangContextValue {
  lang: Lang
  t: Translations
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangContextValue>({
  lang: 'es',
  t: es,
  setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('es')
  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
