import { useEffect, useState } from 'react'
import { Api } from '../../api/Api'
import { Review } from '../../types/models'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const UserReviews = ({ userId }: { userId: string }) => {
    const [reviews, setReviews] = useState<Review[]>([])

    useEffect(() => {
        api.order
            .reviewControllerGetUserReviews(userId, 'placeholder') // id заказа сервер не использует
            .then((res) => {
                const data = (res as unknown as { data: Review[] }).data ?? []
                setReviews(data)
            })
            .catch(() => setReviews([]))
    }, [userId])

    if (!reviews.length) return <p>No reviews yet.</p>

    return (
        <div className="user-reviews">
            <h3>Reviews</h3>
            <div className="review-list">
                {reviews.map((review) => (
                    <div key={review.id} className="review">
                        <div className="review-rating">★ {review.rating}</div>
                        <div className="review-text">{review.text || 'No comment.'}</div>
                        <div className="review-from">From: {review.from?.name}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UserReviews
