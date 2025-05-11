import { useEffect } from 'react'
import './Toast.scss'

interface ToastProps {
    message: string
    onClose: () => void
    duration?: number
}

const Toast = ({ message, onClose, duration = 2000 }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose()
        }, duration)
        return () => clearTimeout(timer)
    }, [duration, onClose])

    return (
        <div className="toast-container">
            {message}
        </div>
    )
}

export default Toast
