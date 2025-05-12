import { useEffect, useState } from 'react';
import { Api } from '../api/Api';
import { Transaction } from '../types/models';
import { useAuth } from '../context/AuthContext.tsx';
import Toast from '../components/ui/Toast';
import './AdminWithdraws.scss';
import { useNavigate } from 'react-router-dom';

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token');
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    },
});

const AdminWithdraws = () => {
    const { user } = useAuth();
    const [withdraws, setWithdraws] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            loadWithdraws();
        }
    }, [user]);

    type RawTransaction = Omit<Transaction, 'amount'> & { amount: string };

    const loadWithdraws = async () => {
        setLoading(true);
        try {
            const res = await api.admin.adminTransactionControllerGetPendingWithdrawals();
            const raw = await res.json() as RawTransaction[];

            const txs: Transaction[] = raw.map((tx) => ({
                ...tx,
                amount: BigInt(tx.amount), // приведение
            }));

            setWithdraws(txs);
        } catch (err) {
            console.error('[AdminWithdraws] Failed to load pending withdrawals:', err);
        } finally {
            setLoading(false);
        }
    };



    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value);
        showToast('Copied!');
    };

    const confirmWithdraw = async (txId: string) => {
        try {
            await api.admin.adminTransactionControllerConfirm(txId);
            loadWithdraws();
        } catch (err) {
            console.error(`[AdminWithdraws] Failed to confirm ${txId}:`, err);
        }
    };

    const cancelWithdraw = async (txId: string) => {
        try {
            await api.admin.adminTransactionControllerCancel(txId);
            loadWithdraws();
        } catch (err) {
            console.error(`[AdminWithdraws] Failed to cancel ${txId}:`, err);
        }
    };

    if (user?.role !== 'ADMIN') {
        return <div>🔒 Access denied. Admins only.</div>;
    }

    return (
        <div className="admin-withdraws">
            <div className="admin-header">
                <h2>⏳ Pending Withdrawals</h2>
                <button className="back-button" onClick={() => navigate('/profile')}>
                    ← Back to Profile
                </button>
            </div>

            {loading && <p>Loading...</p>}
            {withdraws.length === 0 && !loading && <p>No pending withdrawal requests.</p>}

            <ul className="withdraw-list">
                {withdraws.map((tx) => (
                    <li className="withdraw-card" key={tx.id}>
                        <div className="info">
                            <p>
                                <span className="label">💰 Amount:</span>{' '}
                                <span className="copy" onClick={() => handleCopy(String(tx.amount))}>
                                    {tx.amount.toLocaleString()} ISK
                                </span>
                            </p>
                            <p>
                                <span className="label">🧾 Reason:</span>{' '}
                                <span className="copy" onClick={() => handleCopy(tx.reason)}>
                                    {tx.reason}
                                </span>
                            </p>
                            <p>
                                <span className="label">👤 User:</span>{' '}
                                <span className="copy" onClick={() => handleCopy(tx.user?.name || '')}>
                                    {tx.user?.name || '—'}
                                </span>
                            </p>
                        </div>
                        <div className="actions">
                            <button className="confirm" onClick={() => confirmWithdraw(tx.id)}>
                                ✅ Confirm
                            </button>
                            <button className="cancel" onClick={() => cancelWithdraw(tx.id)}>
                                ❌ Cancel
                            </button>
                        </div>
                    </li>
                ))}
            </ul>

            {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
        </div>
    );
};

export default AdminWithdraws;
