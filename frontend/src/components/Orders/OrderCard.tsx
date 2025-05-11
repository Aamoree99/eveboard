import './OrderCard.scss'
import type { Order } from '../../types/models.ts'
import { useLocation, useNavigate } from 'react-router-dom'

const OrderCard = ({ order }: { order: Order }) => {
    const navigate = useNavigate()
    const location = useLocation()

    const creatorName = order.isAnonymous ? 'Anonymous' : order.creator?.name
    const creatorAvatar = order.creator?.avatar || '/fallback-avatar.png'

    const handleClick = () => {
        navigate(`/order?orderId=${order.id}`, {
            state: { background: location },
        })
    }

    const formattedPrice = order.price
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ISK'

    // Determine order status class
    const statusClass = order.status.toLowerCase()
    const promotedClass = order.isPromoting ? 'promoted' : ''

    return (
        <div className={`order-card ${statusClass} ${promotedClass}`} onClick={handleClick}>
            <div className="order-header">
                <div className={`order-type ${statusClass}`}>
                    {order.type
                        .toLowerCase()
                        .replace(/_/g, ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
                <div className={`order-status ${statusClass}`}>
                    {order.status}
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
