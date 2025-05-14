import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import OrderCard from '../components/Orders/OrderCard'
import { Api } from '../api/Api'
import type { Order } from '../types/models'
import type { CorpBalanceResponse } from '../types/api'
import './HomePage.scss'
import { useTranslation } from 'react-i18next'
import PromoBlock from "../components/Promoblock.tsx";
import {Helmet} from "react-helmet-async";


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
    const { t } = useTranslation()
    //const { user } = useAuth()
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
                const finalBalance = Math.max(balData.currentBalance - balData.lockedBalance, 0);
                setCorpBalance(finalBalance);
                setLockedBalance(balData.lockedBalance);
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
            <Helmet/>
            <div className="home-page">
                <h1>{t('home.title')}</h1>
                <p>{t('home.subtitle')}</p>

                <PromoBlock />

                <div className="home-promo-orders">
                    <h2>{t('home.featured')}</h2>
                    {promotedOrders.length ? (
                        <div className="orders-grid">
                            {promotedOrders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    ) : (
                        <p className="empty-state">{t('home.noPromoted')}</p>
                    )}
                </div>
                {/*
                <div className="home-actions">
                    <h2>{t('home.whatDo')}</h2>
                    <div className="home-buttons">
                        <Link to="/orders">
                            <button className="primary-btn">{t('home.viewOrders')}</button>
                        </Link>
                        <Link to="/profile">
                            <button className="secondary-btn">
                                {user ? t('home.goProfile') : t('home.startOrders')}
                            </button>
                        </Link>
                    </div>
                </div>
                */}
                <div className="home-corp-section">
                    <h2>{t('home.balanceTitle')}</h2>
                    <p><strong>{t('home.available')}:</strong> {corpBalance.toLocaleString()} ISK</p>
                    <p><strong>{t('home.locked')}:</strong> {lockedBalance.toLocaleString()} ISK</p>

                    <h3>{t('home.transactions')}</h3>
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
                        <p className="empty-state">{t('home.noTransactions')}</p>
                    )}
                </div>

                <div className="home-why">
                    <h2>{t('home.whyTitle')}</h2>
                    <p>{t('home.whyText')}</p>
                    <ul>
                        <li>{t('home.why1')}</li>
                        <li>{t('home.why2')}</li>
                        <li>{t('home.why3')}</li>
                        <li>{t('home.why4')}</li>
                        <li>{t('home.why5')}</li>
                    </ul>
                </div>

                <div className="home-roadmap-timeline">
                    <h2>{t('home.roadmapTitle')}</h2>
                    <p>{t('home.roadmapIntro')}</p>
                    <div className="timeline">

                        {/* 🔧 До релиза: базовые фичи */}
                        <div className="timeline-item" data-status="done">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapInfra')}</strong>
                                <p>{t('home.roadmapInfraText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="done">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapUi')}</strong>
                                <p>{t('home.roadmapUiText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="done">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapBeta')}</strong>
                                <p>{t('home.roadmapBetaText')}</p>
                            </div>
                        </div>

                        {/* 🟢 Остальные пункты */}
                        <div className="timeline-item" data-status="done">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapLang')}</strong>
                                <p>{t('home.roadmapLangText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="done">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapWithdraw')}</strong>
                                <p>{t('home.roadmapWithdrawText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="in-progress">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapZkill')}</strong>
                                <p>{t('home.roadmapZkillText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="planned">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapMobile')}</strong>
                                <p>{t('home.roadmapMobileText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="planned">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapAnalytics')}</strong>
                                <p>{t('home.roadmapAnalyticsText')}</p>
                            </div>
                        </div>

                        <div className="timeline-item" data-status="planned">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                                <strong>{t('home.roadmapTrust')}</strong>
                                <p>{t('home.roadmapTrustText')}</p>
                            </div>
                        </div>
                    </div>

                    <p className="roadmap-feedback">
                        {t('home.roadmapFeedback')} <a href="https://discord.gg/UFbKTnnCw3">Discord</a>.
                    </p>
                </div>
            </div>
        </Layout>
    )
}

export default HomePage
