import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import OrderCard from '../components/Orders/OrderCard'
import { Api } from '../api/Api'
import type { Order } from '../types/models'
import type { CorpBalanceResponse } from '../types/api'
import './HomePage.scss'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface Wrapper<T> {
    success: boolean
    message: string
    data: T
}

const HomePage: React.FC = () => {
    const { user } = useAuth()
    const [promotedOrders, setPromotedOrders] = useState<Order[]>([])
    const [corpBalance, setCorpBalance] = useState<number>(0)
    const [lockedBalance, setLockedBalance] = useState<number>(0)
    const [transactions, setTransactions] = useState<
        { amount: number; type: string; date: string }[]
    >([])

    useEffect(() => {
        const loadData = async () => {
            try {
                // 1) Fetch promoted orders (wrapped in { success, message, data })
                const promoRes = await api.order.orderControllerGetPromotedOrders({
                    format: 'json',
                })
                const promoWrapper = (promoRes.data as unknown) as Wrapper<Order[]>
                console.log('Promoted orders wrapper:', promoWrapper)
                if (promoWrapper.success) {
                    setPromotedOrders(promoWrapper.data)
                } else {
                    console.error('Failed to load promoted orders:', promoWrapper.message)
                }

                // 2) Fetch corporate balance + transactions
                const balRes = await api.transaction.transactionControllerGetBalance({
                    format: 'json',
                })
                const balData = balRes.data as unknown as CorpBalanceResponse
                console.log('Corp balance data:', balData)
                setCorpBalance(balData.currentBalance)
                setLockedBalance(balData.lockedBalance)
                setTransactions(
                    balData.transactions.map(tx => ({
                        amount: Number(tx.amount),
                        type: tx.externalId,                   // или tx.type, как у тебя
                        date: tx.date ? new Date(tx.date.replace(' ', 'T') + 'Z').toLocaleString() : "Invalid Date",
                    }))
                )
            } catch (e) {
                console.error('Homepage load failed:', e)
            }
        }

        loadData()
    }, [])

    return (
        <Layout>
            <div className="home-page">
                <h1>Welcome to EVE Online Order Platform</h1>
                <p>
                    Here you can create and take orders, manage your transactions, and
                    more.
                </p>

                {/* Featured promoted orders at the top */}
                <div className="home-promo-orders">
                    <h2>🔥 Featured Promoted Orders</h2>
                    {promotedOrders.length ? (
                        <div className="orders-grid">
                            {promotedOrders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">No promoted orders at the moment.</p>
                    )}
                </div>

                <div className="home-actions">
                    <h2>What would you like to do?</h2>
                    <div className="home-buttons">
                        <Link to="/orders">
                            <button className="primary-btn">View Orders</button>
                        </Link>
                        <Link to="/profile">
                            <button className="secondary-btn">
                                {user ? 'Go to Your Profile' : 'Start Taking Orders'}
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="home-corp-section">
                    <h2>📊 EVE Board Balance</h2>
                    <p>
                        <strong>Available:</strong> {corpBalance.toLocaleString()} ISK
                    </p>
                    <p>
                        <strong>Locked:</strong> {lockedBalance.toLocaleString()} ISK
                    </p>

                    <h3>Recent Transactions</h3>
                    {transactions.length ? (
                        <ul className="corp-transactions">
                            {transactions.map((tx, i) => (
                                <li key={i}>
                                    <span>{tx.date}</span>
                                    <span>{tx.type}</span>
                                    <span>{Math.abs(tx.amount).toLocaleString()} ISK</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="empty-state">No recent transactions.</p>
                    )}
                </div>

                <div className="home-why">
                    <h2>Why Choose Us?</h2>
                    <p>
                        We provide a secure and reliable platform for creating and
                        completing orders in the EVE Online universe. With our service, you
                        can be sure that your transactions are safe, your work is
                        recognized, and your progress is rewarded.
                    </p>
                    <ul>
                        <li>Safe and secure transactions</li>
                        <li>Wide variety of orders available</li>
                        <li>Ratings and reviews to ensure trust</li>
                        <li>Payment on completion of tasks</li>
                        <li>Easy to use platform</li>
                    </ul>
                </div>
                <div className="home-roadmap">
                    <h2>Product Roadmap</h2>
                    <p>We’re building the future of contract management in EVE Online. Here’s what’s coming next:</p>
                    <ul>
                        <li>
                            <strong>Multi-language support</strong><br />
                            Global access with localized UI in English, Russian, and more.
                        </li>
                        <li>
                            <strong>Faster withdrawals</strong><br />
                            Improved payout speeds and enhanced transaction clarity.
                        </li>
                        <li>
                            <strong>ZKillboard integration</strong><br />
                            Automated kill verification for bounty contracts.
                        </li>
                        <li>
                            <strong>Mobile optimization</strong><br />
                            Seamless experience on phones and tablets.
                        </li>
                        <li>
                            <strong>Order analytics</strong><br />
                            Insights into your performance, earnings, and activity.
                        </li>
                        <li>
                            <strong>Trust & reputation improvements</strong><br />
                            Enhanced rating systems to build trust between users.
                        </li>
                    </ul>
                    <p className="roadmap-feedback">
                        Have suggestions? Reach out at <a href="https://discord.gg/UFbKTnnCw3">our Discord</a>.
                    </p>
                </div>

            </div>
        </Layout>
    )
}

export default HomePage
