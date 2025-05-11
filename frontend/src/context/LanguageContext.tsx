// context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import i18n from 'i18next'

type LanguageContextType = {
    currentLanguage: string
    setLanguage: (lang: string) => void
    availableLanguages: string[]
}

const LanguageContext = createContext<LanguageContextType>({
    currentLanguage: 'en',
    setLanguage: () => {},
    availableLanguages: [],
})

export const useLanguage = () => useContext(LanguageContext)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<string>('en')

    // 🔒 жестко прописанные языки
    const availableLanguages = ['en', 'ru', 'de', 'fr', 'es', 'cz'];

    useEffect(() => {
        const stored = localStorage.getItem('language')
        const lang = stored || i18n.language || 'en'
        i18n.changeLanguage(lang)
        setCurrentLanguage(lang)
    }, [])

    const setLanguage = (lang: string) => {
        i18n.changeLanguage(lang)
        setCurrentLanguage(lang)
        localStorage.setItem('language', lang)
    }

    return (
        <LanguageContext.Provider value={{ currentLanguage, setLanguage, availableLanguages }}>
            {children}
        </LanguageContext.Provider>
    )
}
