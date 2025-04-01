import { useState } from 'react'
import './CustomSelect.scss'

type Option = {
    value: string
    label: string
}

interface CustomSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false)
    const selectedLabel = options.find((o: Option) => o.value === value)?.label || options[0]?.label

    return (
        <div className="custom-select" tabIndex={0} onBlur={() => setOpen(false)}>
            <div className="custom-select__selected" onClick={() => setOpen(!open)}>
                {selectedLabel}
                <span className={`custom-select__dots ${open ? 'open' : ''}`}>
                  <span className="dot dot-1"></span>
                  <span className="dot dot-2"></span>
                  <span className="dot dot-3"></span>
                </span>

            </div>
            {open && (
                <ul className="custom-select__options">
                    {options.map((opt: Option) => (
                        <li
                            key={opt.value}
                            className={opt.value === value ? 'selected' : ''}
                            onClick={() => {
                                onChange(opt.value)
                                setOpen(false)
                            }}
                        >
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default CustomSelect
