import { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import './CustomSelect.scss' // используем те же стили

const languageLabels: Record<string, string> = {
    en: 'English',
    ru: 'Русский',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    cz: 'Čeština',
};


export const LanguageSelect = () => {
    const { currentLanguage, setLanguage, availableLanguages } = useLanguage()
    const [open, setOpen] = useState(false)

    const selected = languageLabels[currentLanguage] || currentLanguage.toUpperCase()

    const handleSelect = (lang: string) => {
        setLanguage(lang)
        setOpen(false)
    }

    return (
        <div className="custom-select">
            <div className="custom-select__selected" onClick={() => setOpen(prev => !prev)}>
                {selected}
                <span className="custom-select__arrow">{open ? '▲' : '▼'}</span>
            </div>
            {open && (
                <div className="custom-select__options">
                    {availableLanguages.map(lang => (
                        <div
                            key={lang}
                            className={`custom-select__option ${lang === currentLanguage ? 'selected' : ''}`}
                            onClick={() => handleSelect(lang)}
                        >
                            {languageLabels[lang] || lang.toUpperCase()}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
