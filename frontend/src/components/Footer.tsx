import { Link, useLocation } from 'react-router-dom'
import './Footer.scss'

const Footer = () => {
    const location = useLocation()

    return (
        <footer className="footer">
            <div className="footer__content">
                <div className="footer__links">
                    <Link to="/terms" state={{ background: location }}>Terms of Use</Link>
                    <span>·</span>
                    <Link to="/privacy" state={{ background: location }}>Privacy Policy</Link>
                </div>
                <div className="footer__text">
                    © {new Date().getFullYear()} EVE Board · Made by Aamoree99 · All rights belong to CCP Games
                </div>
            </div>
        </footer>
    )
}

export default Footer
