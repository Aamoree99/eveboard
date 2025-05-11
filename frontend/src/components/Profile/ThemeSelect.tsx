import { useState } from 'react'
import './CustomSelect.scss' // Создай файл со стилями

const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'solarized-dark', label: 'Solarized Dark' },
    { value: 'neon', label: 'Neon' },
    { value: 'frost', label: 'Frost' },
    { value: 'forest', label: 'Forest' },
];


export const CustomSelect = ({ value, onChange }: {
    value: string,
    onChange: (value: string) => void
}) => {
    const [open, setOpen] = useState(false)

    const selected = themes.find(t => t.value === value)?.label || 'Select theme'

    const handleSelect = (val: string) => {
        onChange(val)
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
                    {themes.map(theme => (
                        <div
                            key={theme.value}
                            className={`custom-select__option ${theme.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(theme.value)}
                        >
                            {theme.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
