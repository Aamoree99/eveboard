import { Link, useLocation } from 'react-router-dom'
import './LoginModal.scss'
import EveLoginButton from './EveLoginButton.tsx'

const LoginModal = () => {
    const location = useLocation()

    return (
        <div className="login-modal">
            <div className="login-modal__content">
                <EveLoginButton />
                <p>
                    By logging in, you agree to our{' '}
                    <Link to="/terms" state={{ background: location }}>Terms of Use</Link> and{' '}
                    <Link to="/privacy" state={{ background: location }}>Privacy Policy</Link>.
                </p>
            </div>
        </div>
    )
}

export default LoginModal
