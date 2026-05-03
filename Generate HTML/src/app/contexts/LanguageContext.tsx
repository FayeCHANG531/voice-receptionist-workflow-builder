import React, { createContext, useContext, useState, ReactNode } from 'react';

type Lang = 'zh' | 'en';

interface LangCtx {
  lang: Lang;
  toggle: () => void;
  t: (zh: string, en: string) => string;
}

const ctx = createContext<LangCtx>({ lang: 'zh', toggle: () => {}, t: (z) => z });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh');
  return (
    <ctx.Provider value={{
      lang,
      toggle: () => setLang(l => l === 'zh' ? 'en' : 'zh'),
      t: (zh, en) => lang === 'zh' ? zh : en,
    }}>
      {children}
    </ctx.Provider>
  );
}

export const useLang = () => useContext(ctx);
