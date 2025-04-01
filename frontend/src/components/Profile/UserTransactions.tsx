import { useEffect, useState } from 'react'
import { Api } from '../../api/Api'
import { Transaction } from '../../types/models'
import './UserProfile.scss'
import { FaCopy } from 'react-icons/fa'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const LIMIT = 20

const UserTransactions = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

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
    }

    return (
        <div className="user-transactions">
            <h3>Transactions</h3>
            <div className="transaction-list">
                {transactions.map((tx) => (
                    <div className="transaction-preview" key={tx.id} onClick={() => setSelectedTx(tx)}>
                        <span className="type">{tx.type}</span>
                        <span className="amount">{tx.amount.toLocaleString()} ISK</span>
                        <span className="status">{tx.confirmed ? '✔ Confirmed' : '⌛ Pending'}</span>
                        <span className="date">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button onClick={() => loadTransactions(page)} disabled={loading}>
                    {loading ? 'Loading...' : 'Load More'}
                </button>
            )}

            {selectedTx && (
                <div className="tx-modal-overlay" onClick={() => setSelectedTx(null)}>
                    <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
                        <h4>Transaction Details</h4>
                        <p><strong>Type:</strong> {selectedTx.type}</p>
                        <p><strong>Amount:</strong> {selectedTx.amount.toLocaleString()} ISK
                            <button className="copy-btn" onClick={() => handleCopy(selectedTx.amount.toString())}><FaCopy /></button>
                        </p>
                        <p><strong>Reason:</strong> {selectedTx.reason}
                            <button className="copy-btn" onClick={() => handleCopy(selectedTx.reason)}><FaCopy /></button>
                        </p>
                        {selectedTx.externalId && (
                            <p><strong>External ID:</strong> {selectedTx.externalId}
                                <button className="copy-btn" onClick={() => handleCopy(selectedTx.externalId!)}><FaCopy /></button>
                            </p>
                        )}
                        <p><strong>Status:</strong> {selectedTx.confirmed ? 'Confirmed' : 'Pending'}</p>
                        <p><strong>Date:</strong> {new Date(selectedTx.createdAt).toLocaleString()}</p>
                        <button className="user-settings__button" onClick={() => setSelectedTx(null)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserTransactions
