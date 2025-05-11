import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AuthSuccessPage.scss'
import { useTranslation } from 'react-i18next'
import { FiCheckCircle } from 'react-icons/fi'

const AuthSuccessPage = () => {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { fetchUser } = useAuth()
    const { t } = useTranslation()

    const [phase, setPhase] = useState(0)

    useEffect(() => {
        const token = params.get('token')
        if (token) {
            localStorage.setItem('token', token)
            fetchUser()

            let i = 0
            const interval = setInterval(() => {
                i++
                if (i >= 3) {
                    clearInterval(interval)
                    setPhase(3)
                    setTimeout(() => {
                        navigate('/', { replace: true })
                    }, 800)
                } else {
                    setPhase(i)
                }
            }, 600)
        } else {
            navigate('/', { replace: true })
        }
    }, [params, fetchUser, navigate])

    const renderHint = () => {
        switch (phase) {
            case 0:
                return t('auth.hint.loggingIn')
            case 1:
                return t('auth.hint.verifying')
            case 2:
            case 3:
                return t('auth.hint.ready')
            default:
                return ''
        }
    }

    return (
        <div className="auth-success-page">
            <div className="auth-loader">
                {phase < 3 ? (
                    <div className="loader-circle" />
                ) : (
                    <FiCheckCircle size={60} color="var(--accent-color)" className="check-icon" />
                )}
                <div className="auth-message">
                    <span className="loading-text">{renderHint()}</span>
                </div>
            </div>
        </div>
    )
}

export default AuthSuccessPage
