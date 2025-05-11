import './OrderCard.scss'
import type { Order } from '../../types/models.ts'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const OrderCard = ({ order }: { order: Order }) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()

    const creatorName = order.isAnonymous ? t('common.anonymous') : order.creator?.name
    const creatorAvatar = order.creator?.avatar || '/fallback-avatar.png'

    const handleClick = () => {
        navigate(`/order?orderId=${order.id}`, {
            state: { background: location },
        })
    }

    const formattedPrice = order.price
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ISK'

    const statusClass = order.status.toLowerCase()
    const promotedClass = order.isPromoting && order.status === 'ACTIVE' ? 'promoted' : ''

    return (
        <div className={`order-card ${statusClass} ${promotedClass}`} onClick={handleClick}>
            <div className="order-header">
                <div className={`order-type ${statusClass}`}>
                    {t(`orderCard.type.${order.type.toLowerCase()}`)}
                </div>
                <div className={`order-status ${statusClass}`}>
                    {t(`orderCard.status.${order.status.toLowerCase()}`)}
                </div>
            </div>

            <div className="order-title">{order.title}</div>
            <div className="order-desc">{order.description.slice(0, 100)}...</div>
            <div className="order-footer">
                <img src={creatorAvatar} alt="creator" />
                <div className="footer-info">
                    <span className="creator-name">{creatorName}</span>
                    <span className="order-price">{formattedPrice}</span>
                </div>
            </div>
        </div>
    )
}

export default OrderCard
