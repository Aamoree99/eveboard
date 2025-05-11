import { useEffect, useState } from 'react'
import { Api } from '../../api/Api'
import { Transaction } from '../../types/models'
import './UserProfile.scss'
import { FaCopy } from 'react-icons/fa'
import Toast from "../ui/Toast.tsx"
import { useTranslation } from 'react-i18next'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const LIMIT = 20

export const formatDateTime = (input?: string | Date): string => {
    if (!input) return '—'
    const date = new Date(input)
    return isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const UserTransactions = () => {
    const { t } = useTranslation()
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)

    const loadTransactions = (pageNumber = 1) => {
        if (loading) return
        setLoading(true)

        api.transaction.transactionControllerGetAll({ page: pageNumber, limit: LIMIT })
            .then(async (res) => {
                const json = await res.json()
                const txs = json?.data?.data || []

                if (Array.isArray(txs)) {
                    setTransactions((prev) => [
                        ...prev,
                        ...txs.filter((tx) => !prev.some((p) => p.id === tx.id))
                    ])
                    setHasMore(txs.length === LIMIT)
                    setPage(pageNumber + 1)
                } else {
                    console.error('[UserTransactions] Invalid data format:', txs)
                }
            })
            .catch((err) => {
                console.error('[UserTransactions] Failed to load:', err)
            })
            .finally(() => {
                setLoading(false)
            })
    }

    useEffect(() => {
        loadTransactions(1)
    }, [])

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value)
        setToastMessage(t('transactions.copied'))
    }

    return (
        <div className="user-transactions">
            <h3>{t('transactions.title')}</h3>
            <div className="transaction-list">
                {transactions.map((tx) => (
                    <div className="transaction" key={tx.id} onClick={() => setSelectedTx(tx)}>
                        <div className="top-line">
                            <span className="type">{tx.type}</span>
                            <span className="amount">{tx.amount.toLocaleString()} ISK</span>
                        </div>
                        <div className="bottom-line">
                            <span className="status">{tx.confirmed ? t('transactions.confirmed') : t('transactions.pending')}</span>
                            <span className="date">{formatDateTime(tx.createdAt)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button className="load-more-btn" onClick={() => loadTransactions(page)} disabled={loading}>
                    {loading ? t('transactions.loading') : t('transactions.loadMore')}
                </button>
            )}

            {selectedTx && (
                <div className="transaction-modal-backdrop" onClick={() => setSelectedTx(null)}>
                    <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{t('transactions.details')}</h3>

                        <div className="detail">
                            <span>{t('transactions.type')}</span>
                            <code>{selectedTx.type}</code>
                        </div>

                        <div className="detail">
                            <span>{t('transactions.amount')}</span>
                            <code>{selectedTx.amount.toLocaleString()} ISK</code>
                            <button onClick={() => handleCopy(selectedTx.amount.toString())}><FaCopy /></button>
                        </div>

                        <div className="detail">
                            <span>{t('transactions.reason')}</span>
                            <code>{selectedTx.reason}</code>
                            <button onClick={() => handleCopy(selectedTx.reason)}><FaCopy /></button>
                        </div>

                        {selectedTx.externalId && (
                            <div className="detail">
                                <span>{t('transactions.externalId')}</span>
                                <code>{selectedTx.externalId}</code>
                                <button onClick={() => handleCopy(String(selectedTx.externalId))}><FaCopy /></button>
                            </div>
                        )}

                        <div className="detail">
                            <span>{t('transactions.status')}</span>
                            <code>{selectedTx.confirmed ? t('transactions.confirmed') : t('transactions.pending')}</code>
                        </div>

                        <div className="detail">
                            <span>{t('transactions.date')}</span>
                            <code>{formatDateTime(selectedTx.createdAt)}</code>
                        </div>

                        <button className="close-btn" onClick={() => setSelectedTx(null)}>{t('transactions.close')}</button>
                    </div>
                </div>
            )}

            {toastMessage && (
                <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
            )}
        </div>
    )
}

export default UserTransactions
