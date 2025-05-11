import { useState, useEffect, useRef } from 'react'
import './FancyDatePicker.scss'

interface FancyDatePickerProps {
    value: string
    onChange: (date: string) => void
    min?: string
    max?: string
}

const formatDate = (date: Date): string => {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}


const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

const FancyDatePicker = ({ value, onChange, min, max }: FancyDatePickerProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date())

    const selectedDate = value ? new Date(value) : null
    const minDate = min ? new Date(min) : null
    const maxDate = max ? new Date(max) : null

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const getDays = (date: Date) => {
        const start = new Date(date.getFullYear(), date.getMonth(), 1)
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const days: (Date | null)[] = []

        for (let i = 0; i < start.getDay(); i++) days.push(null)
        for (let i = 1; i <= end.getDate(); i++) {
            days.push(new Date(date.getFullYear(), date.getMonth(), i))
        }

        return days
    }

    const handleClickOutside = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false)
        }
    }

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const isDisabled = (d: Date) => {
        return (minDate && d < minDate) || (maxDate && d > maxDate)
    }

    return (
        <div className="fancy-datepicker" ref={ref}>
            <div
                className="fancy-datepicker-display"
                onClick={() => setOpen((o) => !o)}
            >
                {selectedDate ? selectedDate.toLocaleDateString() : 'Select date'}
            </div>

            {open && (
                <div className="fancy-datepicker-calendar">
                    <div className="calendar-header">
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}>‹</button>
                        <span>{viewDate.toLocaleString('default', { month: 'long' })} {viewDate.getFullYear()}</span>
                        <button type="button" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}>›</button>
                    </div>

                    <div className="calendar-grid">
                        {daysOfWeek.map((d) => (
                            <div key={d} className="calendar-day-header">{d}</div>
                        ))}
                        {getDays(viewDate).map((d, i) => {
                            if (!d) return <div key={i} />
                            const disabled = isDisabled(d)
                            return (
                                <div
                                    key={i}
                                    className={`calendar-day ${disabled ? 'disabled' : ''} ${
                                        selectedDate && isSameDay(d, selectedDate) ? 'selected' : ''
                                    }`}
                                    onClick={() => {
                                        if (!disabled) {
                                            onChange(formatDate(d))
                                            setOpen(false)
                                        }
                                    }}
                                >
                                    {d.getDate()}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default FancyDatePicker
