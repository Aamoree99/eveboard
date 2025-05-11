import { useState } from 'react'
import './TransModal.scss'
import { Api } from '../../api/Api'
import type { CreateDepositDto } from '../../types/models'
import { FaCopy } from 'react-icons/fa'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface Props {
    onClose: () => void
}

const DepositModal = ({ onClose }: Props) => {
    const [amount, setAmount] = useState(500_000_000)
    const [loading, setLoading] = useState(false)
    const [depositInfo, setDepositInfo] = useState<{
        amount: number
        reason: string
    } | null>(null)

    const handleSubmit = async () => {
        if (amount < 10_000_000) {
            alert('Minimum deposit is 100,000,000 ISK')
            return
        }

        setLoading(true)
        try {
            const res = await api.transaction.transactionControllerCreate({
                amount,
            } satisfies CreateDepositDto)

            // Явно парсим JSON, если ответ не соответствует ожиданиям
            const json = await res.json();
            console.log('Parsed JSON:', json); // Проверяем структуру ответа

            const transactionData = json?.data;
            if (transactionData && transactionData.reason) {
                const { reason } = transactionData;

                setDepositInfo({
                    amount,
                    reason,
                })
            } else {
                console.error('[DepositModal] Unexpected response structure:', json);
                alert('Failed to create deposit request. Invalid response from server.');
            }
        } catch (e) {
            console.error('[DepositModal] Failed to create deposit', e)
            alert('Failed to create deposit request.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Text copied to clipboard')
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <h2>Deposit ISK</h2>

                {!depositInfo ? (
                    <>
                        <label>
                            Amount (ISK):
                            <input
                                type="number"
                                value={amount}
                                min={500_000_000}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            />
                        </label>
                        <button onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Deposit Request'}
                        </button>
                    </>
                ) : (
                    <div className="deposit-info">
                        <img
                            src="https://images.evetech.net/corporations/98800365/logo?size=128"
                            alt="EVE Board logo"
                            className="deposit-portrait"
                        />
                        <div className="deposit-details">
                            <div className="detail-line">
                                <span className="label">Send ISK to:</span>
                                <span className="value">EVE Board [EVEBD]</span>
                                <button className="copy-btn" onClick={() => handleCopy('EVE Board')}>
                                    <FaCopy/>
                                </button>
                            </div>

                            <div className="detail-line">
                                <span className="label">Amount:</span>
                                <span className="value">{depositInfo.amount.toLocaleString()} ISK</span>
                                <button className="copy-btn"
                                        onClick={() => handleCopy(depositInfo.amount.toLocaleString())}>
                                    <FaCopy/>
                                </button>
                            </div>

                            <div className="detail-line">
                                <span className="label">Reason:</span>
                                <code className="value">{depositInfo.reason}</code>
                                <button className="copy-btn" onClick={() => handleCopy(depositInfo.reason)}>
                                    <FaCopy/>
                                </button>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}

export default DepositModal
