import { useEffect, useState } from 'react'
import { Api } from '../api/Api'
import type { Order } from '../types/models'
import OrderCard from '../components/Orders/OrderCard'
import Layout from '../components/Layout'
import CreateOrderModal from '../components/Orders/CreateOrderModal'
import './MyOrdersPage.scss'
import { useAuth } from '../context/AuthContext'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const  MyOrdersPage = () => {
    const { user } = useAuth()
    const [createdOrders, setCreatedOrders] = useState<Order[]>([])
    const [takenOrders, setTakenOrders] = useState<Order[]>([])
    const [completedOrders, setCompletedOrders] = useState<Order[]>([])
    const [canceledOrders, setCanceledOrders] = useState<Order[]>([])
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        if (!user?.characterId) return
        const currentId = user.characterId

        api.order
            .orderControllerGetAll({
                userId: currentId.toString(),
                limit: 100,
                page: 1,
            })
            .then(async (res) => {
                // Проверяем, есть ли у объекта метод .json (значит это Response, а не готовый объект)
                const json = typeof res.json === 'function' ? await res.json() : res

                const items = json?.data?.items ?? []

                const currentIdNum = Number(currentId)
                if (isNaN(currentIdNum)) return

                setCreatedOrders(
                    items.filter((o: Order) => Number(o.creator?.id) === currentId && o.status !== 'DONE')
                )

                setTakenOrders(
                    items.filter((o: Order) => Number(o.executor?.id) === currentId && o.status !== 'DONE')
                )

                setCompletedOrders(
                    items.filter(
                        (o: Order) =>
                            (Number(o.creator?.id) === currentId || Number(o.executor?.id) === currentId) &&
                            o.status === 'DONE'
                    )
                )
                setCanceledOrders(
                    items.filter(
                        (o: Order) =>
                            (Number(o.creator?.id) === currentId || Number(o.executor?.id) === currentId) &&
                            o.status === 'CANCELED'
                    )
                )

            })
            .catch(console.error)
    }, [user])

    return (
        <Layout>
            <div className="my-orders-page">
                <div className="orders-block">
                    <div className="orders-block__header">
                        <h2>Created Orders</h2>
                        <button onClick={() => setShowCreateModal(true)}>
                            + Create Order
                        </button>
                    </div>

                    {createdOrders.length > 0 ? (
                        <div className="orders-list">
                            {createdOrders.map((order) => (
                                <OrderCard key={order.id} order={order}/>
                            ))}
                        </div>
                    ) : (
                        <p>No created orders yet.</p>
                    )}
                </div>

                <div className="orders-block">
                    <h2>Accepted Orders</h2>
                    {takenOrders.length > 0 ? (
                        <div className="orders-list">
                            {takenOrders.map((order) => (
                                <OrderCard key={order.id} order={order}/>
                            ))}
                        </div>
                    ) : (
                        <p>No accepted orders yet.</p>
                    )}
                </div>

                <div className="orders-block">
                    <h2>Completed Orders</h2>
                    {completedOrders.length > 0 ? (
                        <div className="orders-list">
                            {completedOrders.map((order) => (
                                <OrderCard key={order.id} order={order}/>
                            ))}
                        </div>
                    ) : (
                        <p>No completed orders yet.</p>
                    )}
                </div>

                <div className="orders-block">
                    <h2>Canceled Orders</h2>
                    {canceledOrders.length > 0 ? (
                        <div className="orders-list">
                            {canceledOrders.map((order) => (
                                <OrderCard key={order.id} order={order}/>
                            ))}
                        </div>
                    ) : (
                        <p>No canceled orders yet.</p>
                    )}
                </div>


                {showCreateModal && (
                    <CreateOrderModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => setShowCreateModal(false)}
                    />
                )}
            </div>
        </Layout>
    )
}

export default MyOrdersPage
