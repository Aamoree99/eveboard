import './OrderModal.scss'
import type { Order } from '../../types/models.ts'
import { useEffect, useState } from 'react'
import { Api } from '../../api/Api.ts'
import OrderChat from './OrderChat.tsx'
import { useAuth } from "../../context/AuthContext.tsx";

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface Props {
    order: Order
    onClose: () => void
}

const OrderModal = ({ order, onClose }: Props) => {
    const [loading, setLoading] = useState(false)
    const token = localStorage.getItem('token')
    const { user } = useAuth()
    const currentUserId = user?.characterId
    const isLoggedIn = !!token
    const isCreator = Number(order.creator?.id) === currentUserId
    const isExecutor = Number(order.executor?.id) === currentUserId
    const canTakeOrder = isLoggedIn && order.status === 'ACTIVE' && !isCreator

    const userRating = user?.rating ?? 0;  // Получаем рейтинг текущего пользователя (или 0 если нет рейтинга)
    const isRatingLow = userRating <= order.minRating;

    useEffect(() => {
        document.body.classList.add('modal-open')
        return () => {
            document.body.classList.remove('modal-open')
        }
    }, [])

    const handleAssign = async () => {
        try {
            setLoading(true)
            await api.order.orderControllerTake(order.id)
            window.location.reload()
        } catch (e) {
            console.error('Failed to assign order', e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="order-modal-overlay" onClick={onClose}>
            <div className="order-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="order-content">
                    <div className="order-left">
                        <h2>{order.title}</h2>
                        <div className="order-type">
                            {order.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                        </div>

                        <p className="order-description">{order.description}</p>

                        {order.requirements && (
                            <div className="order-req">
                                <strong>Requirements:</strong>
                                <p>{order.requirements}</p>
                            </div>
                        )}

                        <div className="order-meta">
                            <div><strong>System:</strong> {order.system?.name ?? '—'}</div>
                            <div><strong>Status:</strong> {order.status}</div>
                            <div><strong>Price:</strong> {order.price.toLocaleString()} ISK</div>
                            <div><strong>Deadline:</strong> {order.deadline}</div>
                        </div>

                        {order.status === 'ACTIVE' && !isCreator && (
                            <div className="assign-block">
                                {canTakeOrder ? (
                                    <button
                                        onClick={handleAssign}
                                        disabled={loading || isRatingLow} // Серая кнопка если рейтинг слишком низкий
                                        className={isRatingLow ? 'low-rating' : ''} // Применяем класс для серой кнопки
                                    >
                                        {loading ? 'Taking...' : 'Take Order'}
                                    </button>
                                ) : (
                                    <div className="tooltip-wrapper">
                                        <button disabled>Take Order</button>
                                        {!isLoggedIn && <span className="tooltip">Log in to take this order</span>}
                                        {isRatingLow && <span className="tooltip">Your rating is too low</span>} {/* Tooltip для низкого рейтинга */}
                                    </div>
                                )}
                            </div>
                        )}

                        {isCreator && order.status !== 'DONE' && order.status !== 'CANCELED' && (
                            <div className="manage-block">
                                <button
                                    className="danger"
                                    onClick={async () => {
                                        const confirmed = confirm('Cancel this order? 10% commission will be charged.')
                                        if (!confirmed) return

                                        try {
                                            const res = await api.order.orderControllerUpdateStatus(order.id, {status: 'CANCELED'})
                                            console.log(res)
                                            const json = await res.json()
                                            console.log(json)
                                            if (!res.ok) {
                                                console.error('API error:', json)
                                                alert(json.message || 'Failed to cancel order')
                                                return
                                            }

                                            alert(json.message || 'Order canceled')
                                            window.location.reload()
                                        } catch (e) {
                                            console.error('Unexpected error:', e)
                                            alert('Unexpected error occurred')
                                        }
                                    }}
                                >
                                    ❌ Cancel Order
                                </button>


                                {order.status === 'TAKEN' && (
                                    <button
                                        className="success"
                                        onClick={() => {
                                            if (confirm('Mark this order as DONE? ISK will be transferred.')) {
                                                void api.order.orderControllerUpdateStatus(order.id, {status: 'DONE'})
                                                    .then(() => window.location.reload())
                                            }
                                        }}
                                    >
                                        ✅ Mark as Done
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="order-creator">
                            <span>Created by:</span>
                            <strong>{order.isAnonymous ? 'Anonymous' : order.creator?.name ?? 'Unknown'}</strong>
                            {!order.isAnonymous && order.creator?.rating != null && (
                                <span className="creator-rating"> &nbsp;⭐ {order.creator.rating.toFixed(1)}</span>
                            )}
                        </div>
                    </div>

                    {order.status === 'TAKEN' && (isCreator || isExecutor) && (
                        <div className="order-chat-container">
                            <OrderChat orderId={order.id} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OrderModal
