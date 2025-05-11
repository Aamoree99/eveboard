import './OrderModal.scss'
import type { ComplaintReason, Order } from '../../types/models.ts'
import { useEffect, useState } from 'react'
import { Api } from '../../api/Api.ts'
import OrderChat from './OrderChat.tsx'
import { useAuth } from "../../context/AuthContext.tsx"
import Toast from "../ui/Toast.tsx"
import { useTranslation } from 'react-i18next'

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
    const { t } = useTranslation()
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
    const userRating = user?.rating ?? 0
    const isRatingLow = user?.role !== 'ADMIN' && userRating < order.minRating

    const [isComplaintOpen, setComplaintOpen] = useState(false)
    const [complaintText, setComplaintText] = useState('')
    const [complaintReason, setComplaintReason] = useState<ComplaintReason | ''>('')
    const [submittingComplaint, setSubmittingComplaint] = useState(false)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    const [existingReview, setExistingReview] = useState<{ rating: number; text?: string | null } | null>(null)
    const [reviewRating, setReviewRating] = useState(5)
    const [reviewText, setReviewText] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)

    const [confirmAction, setConfirmAction] = useState<null | (() => void)>(null)
    const [confirmMessage, setConfirmMessage] = useState<string | null>(null)

    const handleSendComplaint = async () => {
        if (!complaintReason) return setToastMessage(t('orderModal.selectReason'))
        setSubmittingComplaint(true)

        try {
            const res = await api.order.orderControllerComplain(order.id, {
                reason: complaintReason,
                comment: complaintText || undefined,
            })
            if (!res.ok) throw new Error()
            setToastMessage(t('orderModal.complaintSubmitted'))
            setComplaintOpen(false)
            setComplaintText('')
            setComplaintReason('')
        } catch {
            setToastMessage(t('orderModal.complaintFailed'))
        } finally {
            setSubmittingComplaint(false)
        }
    }

    useEffect(() => {
        document.body.classList.add('modal-open')

        const checkUserReview = () => {
            if (order.status !== 'DONE' || !user?.id || !Array.isArray(order.reviews)) return
            const myReview = order.reviews.find(r => r.fromId === user.id)
            if (myReview) {
                setExistingReview({ rating: myReview.rating, text: myReview.text ?? '' })
            }
        }

        checkUserReview()
        return () => {
            document.body.classList.remove('modal-open')
        }
    }, [order, user?.id])

    const handleSubmitReview = async () => {
        if (!reviewRating) return
        try {
            setSubmittingReview(true)
            const res = await api.order.reviewControllerCreate(order.id, {
                rating: reviewRating,
                text: reviewText,
            })
            if (!res.ok) throw new Error()
            setToastMessage(t('orderModal.reviewSubmitted'))
            setExistingReview({ rating: reviewRating, text: reviewText })
        } catch {
            setToastMessage(t('orderModal.reviewFailed'))
        } finally {
            setSubmittingReview(false)
        }
    }

    const handleAssign = async () => {
        try {
            setLoading(true)
            await api.order.orderControllerTake(order.id)
            window.location.reload()
        } catch {
            console.error('Failed to assign order')
        } finally {
            setLoading(false)
        }
    }

    const handleSystemClick = async () => {
        if (!order.system?.id) return
        try {
            const res = await api.system.systemControllerGetSystemInfo(order.system.id, { secure: true })
            const { success, message } = await res.json()
            if (success) {
                alert(t('orderModal.routeSet'))
            } else {
                throw new Error(message)
            }
        } catch {
            alert(t('orderModal.routeFailed'))
        }
    }

    return (
        <div className="order-modal-overlay" onClick={onClose}>
            <div className="order-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>X</button>
                <div className="order-content">
                    <div className="order-left">
                        <h2>{order.title}</h2>
                        <div className="order-type">{order.type.replace(/_/g, ' ').toLowerCase()}</div>
                        <p className="order-description">{order.description}</p>

                        {order.requirements && (
                            <div className="order-req">
                                <strong>{t('orderModal.requirements')}:</strong>
                                <p>{order.requirements}</p>
                            </div>
                        )}

                        <div className="order-meta">
                            <div>
                                <strong>{t('orderModal.system')}:</strong>{' '}
                                {order.system?.name ? (
                                    <span className="clickable-system" onClick={handleSystemClick}>
                                        {order.system.name}
                                    </span>
                                ) : '—'}
                            </div>
                            <div><strong>{t('orderModal.status')}:</strong> {order.status}</div>
                            <div><strong>{t('orderModal.price')}:</strong> {order.price.toLocaleString()} ISK</div>
                            <div><strong>{t('orderModal.deadline')}:</strong> {order.deadline}</div>
                        </div>

                        {order.status === 'ACTIVE' && !isCreator && (
                            <div className="assign-block">
                                {canTakeOrder && !isRoleRestricted ? (
                                    <button
                                        onClick={handleAssign}
                                        disabled={loading || isRatingLow}
                                        className={isRatingLow ? 'low-rating' : ''}
                                    >
                                        {loading ? t('orderModal.taking') : t('orderModal.takeOrder')}
                                    </button>
                                ) : (
                                    <div className="tooltip-wrapper">
                                        <button disabled>{t('orderModal.takeOrder')}</button>
                                        {!isLoggedIn && (
                                            <span className="tooltip">{t('orderModal.loginToTake')}</span>
                                        )}
                                        {isRatingLow && (
                                            <span className="tooltip">{t('orderModal.lowRating')}</span>
                                        )}
                                        {isRoleRestricted && (
                                            <span className="tooltip">{t('orderModal.executorRequired')}</span>
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
                                        setConfirmMessage(t('orderModal.cancelOrderConfirm'))
                                        setConfirmAction(() => async () => {
                                            try {
                                                const res = await api.order.orderControllerUpdateStatus(order.id, { status: 'CANCELED' })
                                                const json = await res.json()
                                                if (!res.ok) {
                                                    setToastMessage(json.message || t('orderModal.orderCancelFailed'))
                                                    return
                                                }
                                                setToastMessage(json.message || t('orderModal.orderCancelled'))
                                                setTimeout(() => window.location.reload(), 2000)
                                            } catch {
                                                setToastMessage(t('orderModal.unexpectedError'))
                                            } finally {
                                                setConfirmMessage(null)
                                                setConfirmAction(null)
                                            }
                                        })
                                    }}
                                >
                                    ❌ {t('orderModal.cancelOrder')}
                                </button>

                                {order.status === 'TAKEN' && (
                                    <button
                                        className="success"
                                        onClick={() => {
                                            setConfirmMessage(t('orderModal.markAsDoneConfirm'))
                                            setConfirmAction(() => async () => {
                                                try {
                                                    await api.order.orderControllerUpdateStatus(order.id, { status: 'DONE' })
                                                    window.location.reload()
                                                } catch {
                                                    setToastMessage(t('orderModal.markAsDoneFailed'))
                                                } finally {
                                                    setConfirmMessage(null)
                                                    setConfirmAction(null)
                                                }
                                            })
                                        }}
                                    >
                                        ✅ {t('orderModal.markAsDone')}
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="order-creator">
                            <span>{t('orderModal.createdBy')}</span>
                            <strong>{order.isAnonymous ? t('orderModal.anonymous') : order.creator?.name ?? t('orderModal.unknown')}</strong>
                            {!order.isAnonymous && order.creator?.rating != null && (
                                <span className="creator-rating"> &nbsp;⭐ {order.creator.rating.toFixed(1)}</span>
                            )}
                        </div>

                        <div className="complain-block">
                            <button onClick={() => setComplaintOpen(true)} className="complain-btn">⚠️</button>
                        </div>

                        {isComplaintOpen && (
                            <div className="complaint-modal-overlay" onClick={() => setComplaintOpen(false)}>
                                <div className="complaint-modal" onClick={e => e.stopPropagation()}>
                                    <h3>{t('orderModal.submitComplaint')}</h3>

                                    <label>
                                        {t('orderModal.reason')}:
                                        <select
                                            value={complaintReason}
                                            onChange={(e) => setComplaintReason(e.target.value as ComplaintReason)}
                                        >
                                            <option value="">{t('orderModal.selectReasonPlaceholder')}</option>
                                            <option value="SCAM">{t('orderModal.scam')}</option>
                                            <option value="SPAM">{t('orderModal.spam')}</option>
                                            <option value="HARASSMENT">{t('orderModal.harassment')}</option>
                                            <option value="ABUSE_OF_POWER">{t('orderModal.abuseOfPower')}</option>
                                            <option value="OTHER">{t('orderModal.other')}</option>
                                        </select>
                                    </label>

                                    <label>
                                        {t('orderModal.commentOptional')}
                                        <textarea
                                            placeholder={t('orderModal.commentOptional')}
                                            value={complaintText}
                                            onChange={(e) => setComplaintText(e.target.value)}
                                            rows={4}
                                        />
                                    </label>

                                    <div className="modal-actions">
                                        <button onClick={() => setComplaintOpen(false)}>{t('orderModal.cancel')}</button>
                                        <button onClick={handleSendComplaint} disabled={submittingComplaint || !complaintReason}>
                                            {submittingComplaint ? t('orderModal.submitting') : t('orderModal.send')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {confirmMessage && (
                            <div className="confirm-modal-overlay">
                                <div className="confirm-modal">
                                    <h4>{confirmMessage}</h4>
                                    <div className="modal-actions">
                                        <button onClick={() => { setConfirmMessage(null); setConfirmAction(null) }}>
                                            {t('orderModal.cancel')}
                                        </button>
                                        <button onClick={confirmAction!}>{t('orderModal.confirm')}</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {order.status === 'TAKEN' && (isCreator || isExecutor) && (
                        <div className="order-chat-container">
                            <OrderChat orderId={order.id} />
                        </div>
                    )}

                    {order.status === 'DONE' && (isCreator || isExecutor) && (
                        <div className="review-block">
                            <h3>{t('orderModal.review')}</h3>
                            {existingReview ? (
                                <div className="existing-review">
                                    <p><strong>{t('orderModal.youRated')}</strong> ⭐ {existingReview.rating}</p>
                                    {existingReview.text && <p><em>“{existingReview.text}”</em></p>}
                                </div>
                            ) : (
                                <div className="review-form">
                                    <div className="rating-stars">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <span
                                                key={n}
                                                className={`star ${n <= reviewRating ? 'filled' : ''}`}
                                                onClick={() => setReviewRating(n)}
                                            >★</span>
                                        ))}
                                    </div>

                                    <label>
                                        {t('orderModal.commentOptional')}
                                        <textarea
                                            value={reviewText}
                                            onChange={(e) => setReviewText(e.target.value)}
                                            rows={3}
                                            placeholder={t('orderModal.shareExperience')}
                                        />
                                    </label>

                                    <button onClick={handleSubmitReview} disabled={submittingReview}>
                                        {submittingReview ? t('orderModal.submitting') : t('orderModal.submitReview')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    )
}

export default OrderModal
