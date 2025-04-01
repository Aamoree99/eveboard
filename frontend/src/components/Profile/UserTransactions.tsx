import { useEffect, useState } from 'react'
import { Api } from '../../api/Api'
import { Transaction } from '../../types/models'

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

    const loadTransactions = (pageNumber = 1) => {
        if (loading) return

        setLoading(true)

        api.transaction.transactionControllerGetAll(
            {
                page: pageNumber,
                limit: LIMIT,
            }
        )
            .then(async (res) => {
                const json = await res.json()
                const txs = json?.data?.data || []

                if (Array.isArray(txs)) {
                    setTransactions((prev) => [
                        ...prev,
                        ...txs.filter((tx) => !prev.some((p) => p.id === tx.id)),
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

    return (
        <div className="user-transactions">
            <h3>Transactions</h3>
            <div className="transaction-list">
                {transactions.map((tx) => (
                    <div className="transaction" key={tx.id}>
                        <span className="type">{tx.type}</span>
                        <span className="amount">{tx.amount.toLocaleString()} ISK</span>
                        <span className="date">{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>

            {hasMore && (
                <button onClick={() => loadTransactions(page)} disabled={loading}>
                    {loading ? 'Загрузка...' : 'Следующая страница'}
                </button>
            )}
        </div>
    )
}

export default UserTransactions
