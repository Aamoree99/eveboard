import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import './CustomSelect.scss'

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
    const [openUp, setOpenUp] = useState(false)
    const selectRef = useRef<HTMLDivElement>(null)

    const selected = languageLabels[currentLanguage] || currentLanguage.toUpperCase()

    const handleSelect = (lang: string) => {
        setLanguage(lang)
        setOpen(false)
    }

    useEffect(() => {
        if (open && selectRef.current) {
            const rect = selectRef.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const dropdownHeight = 200 // примерная высота дропа
            setOpenUp(spaceBelow < dropdownHeight)
        }
    }, [open])

    return (
        <div
            className={`custom-select ${openUp ? 'custom-select--open-up' : ''}`}
            ref={selectRef}
        >
            <div className="custom-select__selected" onClick={() => setOpen(prev => !prev)}>
                {selected}
                <span className={`custom-select__arrow ${open ? 'open' : ''}`}>▼</span>
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
