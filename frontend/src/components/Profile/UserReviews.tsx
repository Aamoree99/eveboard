import React, { useEffect, useState } from 'react'
import { Api } from '../../api/Api'
import { Review } from '../../types/models'
import { useTranslation } from 'react-i18next'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface UserReviewsProps {
    userId: string
}

interface Wrapper<T> {
    success: boolean
    message: string
    data: T
}

const UserReviews: React.FC<UserReviewsProps> = ({ userId }) => {
    const { t } = useTranslation()
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return

        setLoading(true)
        setError(null)

        api.order
            .reviewControllerGetUserReviews(userId, '0', { format: 'json' })
            .then((res) => {
                const wrapper = res.data as unknown as Wrapper<Review[]>
                setReviews(wrapper.data ?? [])
            })
            .catch((err) => {
                console.error('Failed to fetch reviews:', err)
                setError(t('reviews.loadError'))
                setReviews([])
            })
            .finally(() => {
                setLoading(false)
            })
    }, [userId, t])

    if (loading) return <p>{t('reviews.loading')}</p>
    if (error) return <p>{error}</p>
    if (!reviews.length) return <p>{t('reviews.empty')}</p>

    return (
        <div className="user-reviews">
            <h3>{t('reviews.title')}</h3>
            <div className="review-list">
                {reviews.map((review) => (
                    <div key={review.id} className="review">
                        <div className="review-rating">★ {review.rating}</div>
                        <div className="review-text">
                            {review.text?.trim() ? review.text : t('reviews.noComment')}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UserReviews
