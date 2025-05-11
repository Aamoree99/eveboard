import { useTheme } from '../context/ThemeContext'

const EveLoginButton = () => {
    const { theme } = useTheme()

    const loginUrl = import.meta.env.VITE_EVE_LOGIN_URL

    const buttonSrc =
        theme === 'dark'
            ? '/images/eve-sso-login-black-large.png'
            : '/images/eve-sso-login-white-large.png'

    return (
        <button
            onClick={() => window.location.href = loginUrl}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
            <img src={buttonSrc} alt="Log in with EVE Online" height={40} />
        </button>
    )
}

export default EveLoginButton
