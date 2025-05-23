import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Api } from '../../api/Api.ts'
import OrderModal from './OrderModal.tsx'
import type { Order } from '../../types/models.ts'
import { useTranslation } from 'react-i18next'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const OrderModalFromUrl = () => {
    const { t } = useTranslation()
    const [order, setOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderId = searchParams.get('orderId')

    useEffect(() => {
        if (!orderId) return

        setLoading(true)
        setError(false)

        api.order.orderControllerGetOne(orderId)
            .then(res => res.json())
            .then(json => {
                if (json?.data) {
                    setOrder(json.data)
                } else {
                    setError(true)
                }
                setLoading(false)
            })
            .catch(() => {
                setError(true)
                setLoading(false)
            })
    }, [orderId])

    const closeModal = () => {
        if (window.history.length <= 2) {
            navigate('/')
        } else {
            navigate(-1)
        }
    }

    if (loading) {
        return (
            <div className="modal-overlay">
                <div className="modal-loading">{t('orderModal.loading')}</div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="modal-overlay">
                <div className="modal-error">
                    <p>{t('orderModal.error')}</p>
                    <button onClick={closeModal}>{t('orderModal.close')}</button>
                </div>
            </div>
        )
    }

    return <OrderModal order={order} onClose={closeModal} />
}

export default OrderModalFromUrl
