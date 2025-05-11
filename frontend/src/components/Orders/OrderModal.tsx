import './OrderModal.scss'
import type {ComplaintReason, Order} from '../../types/models.ts'
import { useEffect, useState } from 'react'
import { Api } from '../../api/Api.ts'
import OrderChat from './OrderChat.tsx'
import { useAuth } from "../../context/AuthContext.tsx";
import Toast from "../ui/Toast.tsx";

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
    const forbiddenRoles = ['USER', 'PENDING']
    const isRoleRestricted = user ? forbiddenRoles.includes(user.role) : true
    const canTakeOrder = isLoggedIn && order.status === 'ACTIVE' && !isCreator

    const userRating = user?.rating ?? 0;  // Получаем рейтинг текущего пользователя (или 0 если нет рейтинга)
    const isRatingLow = user?.role !== 'ADMIN' && userRating < order.minRating;

    const [isComplaintOpen, setComplaintOpen] = useState(false)
    const [complaintText, setComplaintText] = useState('')
    const [complaintReason, setComplaintReason] = useState<ComplaintReason | ''>('')
    const [submittingComplaint, setSubmittingComplaint] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    // 👇 review-related state
    const [existingReview, setExistingReview] = useState<{
        rating: number
        text?: string | null
    } | null>(null)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewText, setReviewText] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)

    const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null)
    const [confirmMessage, setConfirmMessage] = useState<string | null>(null)



    const handleSendComplaint = async () => {
        if (!complaintReason) return setToastMessage('Please select a reason')

        setSubmittingComplaint(true)

        try {
            const res = await api.order.orderControllerComplain(order.id, {
                reason: complaintReason,
                comment: complaintText || undefined,
            })
            if (!res.ok) throw new Error('Failed to send complaint')

            setToastMessage('Complaint submitted. Thank you.')
            setComplaintOpen(false)
            setComplaintText('')
            setComplaintReason('')
        } catch {
            setToastMessage('Failed to submit complaint')
        } finally {
            setSubmittingComplaint(false)
        }
    }


    useEffect(() => {
        document.body.classList.add('modal-open');

        const checkUserReview = () => {
            if (order.status !== 'DONE' || !user?.id || !Array.isArray(order.reviews)) return;

            const myReview = order.reviews.find(r => r.fromId === user.id);
            if (myReview) {
                setExistingReview({
                    rating: myReview.rating,
                    text: myReview.text ?? '',
                });
            }
        };

        checkUserReview();

        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [order, user?.id]);



    const handleSubmitReview = async () => {
        if (!reviewRating) return

        try {
            setSubmittingReview(true)
            const res = await api.order.reviewControllerCreate(order.id, {
                rating: reviewRating,
                text: reviewText,
            })

            if (!res.ok) throw new Error('Failed to submit review')

            setToastMessage('✅ Review submitted, thank you!')
            setExistingReview({ rating: reviewRating, text: reviewText })
        } catch (e) {
            console.error('Submit failed', e)
            setToastMessage('❌ Failed to submit review')
        } finally {
            setSubmittingReview(false)
        }
    }


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

    const handleSystemClick = async () => {
        if (!order.system?.id) return

        try {
            const res = await api.system.systemControllerGetSystemInfo(order.system.id, {secure: true})
            console.log(res)
            const { success, message } = await res.json()

            if (success) {
                alert('Route has been set in your EVE client.')
            } else {
                throw new Error(message)
            }
        } catch (err) {
            console.error('Failed to set route', err)
            alert('Failed to set route in EVE client.')
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
                            <div>
                                <strong>System:</strong>{' '}
                                {order.system?.name ? (
                                    <span className="clickable-system" onClick={handleSystemClick}>
                                    {order.system.name}
                                  </span>
                                ) : (
                                    '—'
                                )}
                            </div>
                            <div><strong>Status:</strong> {order.status}</div>
                            <div><strong>Price:</strong> {order.price.toLocaleString()} ISK</div>
                            <div><strong>Deadline:</strong> {order.deadline}</div>
                        </div>

                        {order.status === 'ACTIVE' && !isCreator && (
                            <div className="assign-block">
                                {canTakeOrder && !isRoleRestricted ? (
                                    <button
                                        onClick={handleAssign}
                                        disabled={loading || isRatingLow}
                                        className={isRatingLow ? 'low-rating' : ''}
                                    >
                                        {loading ? 'Taking...' : 'Take Order'}
                                    </button>
                                ) : (
                                    <div className="tooltip-wrapper">
                                        <button disabled>Take Order</button>
                                        {!isLoggedIn && (
                                            <span className="tooltip">Log in to take this order</span>
                                        )}
                                        {isRatingLow && (
                                            <span className="tooltip">Your rating is too low</span>
                                        )}
                                        {isRoleRestricted && (
                                            <span className="tooltip">You must apply as an executor</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {isCreator && order.status !== 'DONE' && order.status !== 'CANCELED' && (
                            <div className="manage-block">
                                <button
                                    className="danger"
                                    onClick={() => {
                                        setConfirmMessage('Cancel this order? 10% commission will be charged.')
                                        setConfirmAction(() => async () => {
                                            try {
                                                const res = await api.order.orderControllerUpdateStatus(order.id, { status: 'CANCELED' })
                                                const json = await res.json()

                                                if (!res.ok) {
                                                    console.error('API error:', json)
                                                    setToastMessage(json.message || 'Failed to cancel order')
                                                    return
                                                }

                                                setToastMessage(json.message || 'Order canceled')
                                                setTimeout(() => window.location.reload(), 2000)
                                            } catch (e) {
                                                console.error('Unexpected error:', e)
                                                setToastMessage('Unexpected error occurred')
                                            } finally {
                                                setConfirmMessage(null)
                                                setConfirmAction(null)
                                            }
                                        })
                                    }}

                                >
                                    ❌ Cancel Order
                                </button>


                                {order.status === 'TAKEN' && (
                                    <button
                                        className="success"
                                        onClick={() => {
                                            setConfirmMessage('Mark this order as DONE? ISK will be transferred.')
                                            setConfirmAction(() => async () => {
                                                try {
                                                    await api.order.orderControllerUpdateStatus(order.id, { status: 'DONE' })
                                                    window.location.reload()
                                                } catch (e) {
                                                    console.error('Failed to update status:', e)
                                                    setToastMessage('Failed to mark as done')
                                                } finally {
                                                    setConfirmMessage(null)
                                                    setConfirmAction(null)
                                                }
                                            })
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
                        <div className="complain-block">
                            <button onClick={() => setComplaintOpen(true)} className="complain-btn">
                                ⚠️
                            </button>
                        </div>
                        {isComplaintOpen && (
                            <div className="complaint-modal-overlay" onClick={() => setComplaintOpen(false)}>
                                <div className="complaint-modal" onClick={(e) => e.stopPropagation()}>
                                    <h3>Submit Complaint</h3>

                                    <label>
                                        Reason:
                                        <select
                                            value={complaintReason}
                                            onChange={(e) => setComplaintReason(e.target.value as ComplaintReason)}
                                        >
                                            <option value="">-- Select Reason --</option>
                                            <option value="SCAM">Scam</option>
                                            <option value="SPAM">Spam</option>
                                            <option value="HARASSMENT">Harassment</option>
                                            <option value="ABUSE_OF_POWER">Abuse of Power</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </label>

                                    <label>
                                        Comment (optional):
                                        <textarea
                                            placeholder="Details (optional)"
                                            value={complaintText}
                                            onChange={(e) => setComplaintText(e.target.value)}
                                            rows={4}
                                        />
                                    </label>

                                    <div className="modal-actions">
                                        <button onClick={() => setComplaintOpen(false)}>Cancel</button>
                                        <button onClick={handleSendComplaint} disabled={submittingComplaint || !complaintReason}>
                                            {submittingComplaint ? 'Submitting...' : 'Send'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {confirmMessage && (
                        <div className="confirm-modal-overlay">
                            <div className="confirm-modal">
                                <h4>{confirmMessage}</h4>
                                <div className="modal-actions">
                                    <button
                                        onClick={() => {
                                            setConfirmMessage(null)
                                            setConfirmAction(null)
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button onClick={confirmAction!}>Confirm</button>
                                </div>
                            </div>
                        </div>
                    )}



                    {order.status === 'TAKEN' && (isCreator || isExecutor) && (
                        <div className="order-chat-container">
                            <OrderChat orderId={order.id}/>
                        </div>
                    )}
                    {order.status === 'DONE' && (isCreator || isExecutor) && (
                        <div className="review-block">
                            <h3>Review</h3>

                            {existingReview ? (
                                <div className="existing-review">
                                    <p><strong>You rated:</strong> ⭐ {existingReview.rating}</p>
                                    {existingReview.text && <p><em>“{existingReview.text}”</em></p>}
                                </div>
                            ) : (
                                <div className="review-form">
                                    <div className="rating-stars">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <span
                                                key={n}
                                                className={`star ${n <= reviewRating ? 'filled' : ''}`}
                                                onClick={() => setReviewRating(n)}
                                            >
                                            ★
                                        </span>
                                        ))}
                                    </div>


                                    <label>
                                        Comment (optional):
                                        <textarea
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            rows={3}
                                            placeholder="Share your experience..."
                                        />
                                    </label>

                                    <button onClick={handleSubmitReview} disabled={submittingReview}>
                                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
            {toastMessage && (
                <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
            )}
        </div>
    )
}

export default OrderModal
