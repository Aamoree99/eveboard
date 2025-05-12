import { useNavigate } from 'react-router-dom'
import './LegalModal.scss'
import { useTranslation } from 'react-i18next'

const PrivacyModal = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()

    return (
        <div className="legal-modal-overlay" onClick={() => navigate(-1)}>
            <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
                <h1>{t('privacy.title')}</h1>
                <p>{t('privacy.updated')}</p>

                <h2>1. {t('privacy.access.title')}</h2>
                <p>{t('privacy.access.desc')}</p>
                <ul>
                    {(t('privacy.access.list', { returnObjects: true }) as Array<{ scope: string; desc: string }>).map((item, i) => (
                        <li key={i}>
                            <strong>{item.scope}</strong> — {item.desc}
                        </li>
                    ))}
                </ul>

                <h2>2. {t('privacy.why.title')}</h2>
                <p>{t('privacy.why.desc')}</p>
                <ul>
                    {(t('privacy.why.list', { returnObjects: true }) as string[]).map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>

                <h2>3. {t('privacy.no.title')}</h2>
                <ul>
                    {(t('privacy.no.list', { returnObjects: true }) as string[]).map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                    ))}
                </ul>

                <h2>4. {t('privacy.storage.title')}</h2>
                <p>{t('privacy.storage.desc')}</p>
            </div>
        </div>

    )
}

export default PrivacyModal
