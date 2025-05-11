import React, { useEffect, useState } from 'react'
import { Api } from '../../api/Api'
import { Review } from '../../types/models'

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

// Тип обёртки ответа от сервера
interface Wrapper<T> {
    success: boolean
    message: string
    data: T
}

const UserReviews: React.FC<UserReviewsProps> = ({ userId }) => {
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
                // сначала превращаем res.data в нашу обёртку
                // TS-каст через unknown, чтобы обойти строгий generic
                const wrapper = (res.data as unknown) as Wrapper<Review[]>
                console.log('Wrapped response:', wrapper)
                // теперь внутри wrapper.data — массив Review
                setReviews(wrapper.data ?? [])
            })
            .catch((err) => {
                console.error('Failed to fetch reviews:', err)
                setError('Failed to load reviews.')
                setReviews([])
            })
            .finally(() => {
                setLoading(false)
            })
    }, [userId])

    if (loading) return <p>Loading reviews…</p>
    if (error) return <p>{error}</p>
    if (!reviews.length) return <p>No reviews yet.</p>

    return (
        <div className="user-reviews">
            <h3>Reviews</h3>
            <div className="review-list">
                {reviews.map((review) => (
                    <div key={review.id} className="review">
                        <div className="review-rating">★ {review.rating}</div>
                        <div className="review-text">
                            {review.text?.trim() ? review.text : 'No comment.'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UserReviews
