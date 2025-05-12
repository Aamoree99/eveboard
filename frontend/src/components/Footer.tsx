import { Link, useLocation } from 'react-router-dom'
import './Footer.scss'
import { useTranslation } from 'react-i18next'
import {LanguageSelect} from './Profile/LanguageSelect.tsx'

const Footer = () => {
    const location = useLocation()
    const { t } = useTranslation()

    return (
        <footer className="footer">
            <div className="footer__content">
                <div className="footer__links">
                    <Link to="/terms" state={{ background: location }}>{t('footer.terms')}</Link>
                    <span>·</span>
                    <Link to="/privacy" state={{ background: location }}>{t('footer.privacy')}</Link>
                </div>

                <div className="footer__center-wrap">
                    <div className="footer__text">
                        © {new Date().getFullYear()} EVE Board · {t('footer.madeBy')} Aamoree99 · {t('footer.rights')}
                    </div>
                    <div className="footer__lang">
                        <LanguageSelect />
                    </div>
                </div>
            </div>
        </footer>

    )
}

export default Footer
