import { Link, useLocation } from 'react-router-dom'
import './LoginModal.scss'
import EveLoginButton from './EveLoginButton.tsx'
import { useTranslation } from 'react-i18next'

const LoginModal = () => {
    const location = useLocation()
    const { t } = useTranslation()

    return (
        <div className="login-modal">
            <div className="login-modal__content">
                <EveLoginButton />
                <p>
                    {t('login.agree1')}{' '}
                    <Link to="/terms" state={{ background: location }}>{t('login.terms')}</Link>{' '}
                    {t('login.and')}{' '}
                    <Link to="/privacy" state={{ background: location }}>{t('login.privacy')}</Link>.
                </p>
            </div>
        </div>
    )
}

export default LoginModal
