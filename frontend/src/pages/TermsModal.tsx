import { useNavigate } from 'react-router-dom'
import './LegalModal.scss'
import { useTranslation } from 'react-i18next'

const TermsModal = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()

    const sections = t('terms.sections', { returnObjects: true }) as Array<{ title: string; text: string }>

    return (
        <div className="legal-modal-overlay" onClick={() => navigate(-1)}>
            <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
                <h1>{t('terms.title')}</h1>
                <p>{t('terms.updated')}</p>

                {sections.map((section, i) => (
                    <div key={i}>
                        <h2>{`${i + 1}. ${section.title}`}</h2>
                        <p>{section.text}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default TermsModal
