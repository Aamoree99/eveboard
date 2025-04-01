import { useEffect, useState } from 'react'
import OrderCard from '../Orders/OrderCard.tsx'
import OrderModal from '../Orders/OrderModal.tsx'
import { Api } from '../../api/Api'
import type { Order, User } from '../../types/models'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreateOrderModal from '../Orders/CreateOrderModal.tsx'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface Props {
    user: User
    isOwnProfile: boolean
}

const UserOrders = ({ user, isOwnProfile }: Props) => {
    const [createdOrders, setCreatedOrders] = useState<Order[]>([])
    const [completedOrders, setCompletedOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderIdFromUrl = searchParams.get('orderId')

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.order.orderControllerGetAll({ userId: user.id })
                const json = await res.json()

                const data: Order[] = json?.data ?? []
                const userRating = user.rating ?? 0

                const created = data
                    .filter((o) => o.creator?.id === user.id)
                    .filter((o) => userRating >= (o.minRating ?? 0))

                const completed = data
                    .filter((o) => o.executor?.id === user.id)
                    .filter((o) => userRating >= (o.minRating ?? 0))

                setCreatedOrders(created)
                setCompletedOrders(completed)
            } catch (e) {
                console.error('[UserOrders] Failed to fetch orders:', e)
            }
        }

        void fetchOrders()
    }, [user.id, showCreateModal])

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderIdFromUrl) return
            try {
                const res = await api.order.orderControllerGetOne(orderIdFromUrl)
                const data = (res as unknown as { data: Order }).data
                setSelectedOrder(data)
            } catch (e) {
                console.error('Failed to fetch order from profile', e)
            }
        }

        void fetchOrder()
    }, [orderIdFromUrl])

    const closeModal = () => {
        setSelectedOrder(null)
        navigate(window.location.pathname, { replace: true }) // очищаем orderId без смены страницы
    }

    return (
        <div className="user-orders">
            <section>
                <div className="orders-header">
                    <h3>{isOwnProfile ? 'Created Orders' : 'Their Orders'}</h3>
                    {isOwnProfile && (
                        <button className="create-order-btn" onClick={() => setShowCreateModal(true)}>
                            + Create Order
                        </button>
                    )}
                </div>
                {createdOrders.length > 0 ? (
                    <div className="orders-list">
                        {createdOrders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <p>No orders yet.</p>
                )}
            </section>

            <section>
                <h3>Completed Orders</h3>
                {completedOrders.length > 0 ? (
                    <div className="orders-list">
                        {completedOrders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                ) : (
                    <p>No completed orders.</p>
                )}
            </section>

            {selectedOrder && <OrderModal order={selectedOrder} onClose={closeModal} />}

            {showCreateModal && (
                <CreateOrderModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => setShowCreateModal(false)}
                />
            )}
        </div>
    )
}

export default UserOrders
