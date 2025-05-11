import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Api } from '../api/Api'
import type { Order, OrderType } from '../types/models'
import OrderCard from '../components/Orders/OrderCard'
import OrderModal from '../components/Orders/OrderModal'
import Layout from '../components/Layout'
import './OrdersPage.scss'
import CreateOrderModal from '../components/Orders/CreateOrderModal'
import CustomSelect from '../components/CustomSelect'
import { useAuth } from '../context/AuthContext.tsx'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

type OrderStatus = 'ACTIVE' | 'TAKEN' | 'DONE' | 'CANCELED'

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
    KILL_TARGET: 'Kill Target',
    SCAN_WORMHOLE: 'Scan Wormhole',
    SCOUT_SYSTEM: 'Scout System',
    LOGISTICS: 'Logistics',
    ESCORT: 'Escort',
    STRUCTURE_WORK: 'Structure Work',
    CHARACTER_INFO: 'Character Info',
    ROUTE_PLANNING: 'Route Planning',
    COUNTER_INTEL: 'Counter-Intel',
    EVENT_FARMING: 'Event Farming',
    PVP_ASSIST: 'PvP Assist',
    OTHER: 'Other',
}

const OrdersPage = () => {
    const { user } = useAuth()
    const [orders, setOrders] = useState<Order[]>([])
    const [status, setStatus] = useState<OrderStatus | undefined>()
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priceAsc' | 'priceDesc'>('newest')
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedType, setSelectedType] = useState<OrderType | undefined>()

    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const orderIdFromUrl = searchParams.get('orderId')

    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const userRating = user?.rating ?? 0

    useEffect(() => {
        setPage(1)
    }, [status, sortBy, selectedType])

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const params: Record<string, string | number | undefined> = {}
                if (status) params.status = status
                if (selectedType) params.type = selectedType
                if (page) params.page = page

                const res = await api.order.orderControllerGetAll(params)
                const json = await res.json()

                if (!Array.isArray(json?.data?.items)) {
                    console.error('Expected json.data.items to be an array, got:', json?.data)
                    setOrders([])
                    setHasMore(false)
                    return
                }

                const fetched: Order[] = json.data.items
                const updatedOrders = page === 1 ? [...fetched] : [...orders, ...fetched]

                let sorted = [...updatedOrders]
                if (sortBy === 'priceAsc') {
                    sorted.sort((a, b) => a.price - b.price)
                } else if (sortBy === 'priceDesc') {
                    sorted.sort((a, b) => b.price - a.price)
                } else if (sortBy === 'oldest') {
                    sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                } else {
                    sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                }

                sorted = [
                    ...sorted.filter(o => o.isPromoting),
                    ...sorted.filter(o => !o.isPromoting)
                ]

                const filteredOrders = user
                    ? sorted.filter(order => order.minRating <= userRating)
                    : sorted

                setOrders(filteredOrders)
                setHasMore(fetched.length === 20)
            } catch (e) {
                console.error('Failed to fetch orders:', e)
            }
        }

        void fetchOrders()
    }, [status, sortBy, selectedType, page, showCreateModal])

    useEffect(() => {
        const fetchOrderById = async () => {
            if (!orderIdFromUrl) return
            try {
                const res = await api.order.orderControllerGetOne(orderIdFromUrl)
                const json = await res.json()
                const data: Order = json.data
                setSelectedOrder(data)
            } catch (e) {
                console.error('Failed to fetch order by ID:', e)
            }
        }

        void fetchOrderById()
    }, [orderIdFromUrl])

    const closeModal = () => {
        setSelectedOrder(null)
        navigate('/orders', { replace: true })
    }

    const loadMoreOrders = () => {
        setPage(prevPage => prevPage + 1)
    }

    const statusOptions = [
        { value: '', label: 'All statuses' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'TAKEN', label: 'Taken' },
        { value: 'DONE', label: 'Done' },
        { value: 'CANCELED', label: 'Canceled' },
    ]

    const sortOptions = [
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
        { value: 'priceAsc', label: 'Price (Low to High)' },
        { value: 'priceDesc', label: 'Price (High to Low)' },
    ]

    const typeOptions = [
        { value: '', label: 'All types' },
        ...Object.entries(ORDER_TYPE_LABELS).map(([value, label]) => ({
            value: value as OrderType,
            label,
        })),
    ]

    return (
        <Layout>
            <div className="orders-page">
                <div className="orders-page__header">
                    <h1>Orders</h1>
                    <button className="create-order-btn" onClick={() => setShowCreateModal(true)}>
                        + Create Order
                    </button>
                </div>

                <div className="filters">
                    <CustomSelect
                        options={statusOptions}
                        value={status ?? ''}
                        onChange={(val) => setStatus(val === '' ? undefined : val as OrderStatus)}
                    />

                    <CustomSelect
                        options={typeOptions}
                        value={selectedType ?? ''}
                        onChange={(val) => setSelectedType(val === '' ? undefined : val as OrderType)}
                    />

                    <CustomSelect
                        options={sortOptions}
                        value={sortBy}
                        onChange={(val) => setSortBy(val as 'newest' | 'oldest' | 'priceAsc' | 'priceDesc')}
                    />
                </div>

                <div className="orders-list">
                    {orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                    {orders.length === 0 && <p>No orders found.</p>}
                </div>

                {hasMore && (
                    <button className="load-more-btn" onClick={loadMoreOrders}>
                        Load More
                    </button>
                )}

                {selectedOrder && (
                    <OrderModal order={selectedOrder} onClose={closeModal} />
                )}

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

export default OrdersPage
