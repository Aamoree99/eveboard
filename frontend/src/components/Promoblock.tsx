import './promoblock.scss'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { Api } from '../api/Api'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const GOAL = 50

const PromoBlock = () => {
    const { t } = useTranslation()
    const { user } = useAuth()
    const [completed, setCompleted] = useState<number | null>(null)

    useEffect(() => {
        if (!user) return
        api.order.orderControllerGetCompletedOrderCount()
            .then(async (res) => {
                const json = await res.json()
                setCompleted(json?.count ?? 0)
            })
            .catch((err) => {
                console.error('[PromoBlock] Failed to load completed order count', err)
            })
    }, [user])

    const percent = completed !== null ? Math.min(100, (completed / GOAL) * 100) : 0

    return (
        <div className="promo-gila-block">
            <div className="promo-gila-image-wrapper">
                <img src="/images/gila.jpg" alt="Gila" className="gila-image" />
                <a
                    href="https://www.eveonline.com/news/view/abyssal-skins-now-available-for-the-gila"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gila-source"
                >
                    Image © CCP Games — source
                </a>
            </div>

            <div className="promo-gila-text">
                <h3>{t('promo.gilaTitle')}</h3>
                <p>{t('promo.gilaDesc')}</p>

                {completed !== null && (
                    <>
                        <div className="promo-progress-bar">
                            <div className="filled" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="promo-progress-label">
                            {t('promo.gilaProgress', { current: completed, goal: GOAL })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PromoBlock
