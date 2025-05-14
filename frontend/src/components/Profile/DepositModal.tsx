import { useState } from 'react'
import './TransModal.scss'
import { Api } from '../../api/Api'
import { FaCopy } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'

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
    const { t } = useTranslation()
    const [amount, setAmount] = useState(500_000_000)
    const [loading, setLoading] = useState(false)
    const [depositInfo, setDepositInfo] = useState<{
        amount: number
        reason: string
    } | null>(null)

    const handleSubmit = async () => {
        if (amount < 100_000_000) {
            alert(t('deposit.minAlert'))
            return
        }

        setLoading(true)
        try {
            const res = await api.transaction.transactionControllerCreate({ amount })

            // Проверка, что fetch вернул 2xx
            if (!res.ok) {
                let errorText = ''
                try {
                    errorText = await res.text()
                } catch {
                    errorText = 'Failed to parse error text'
                }

                console.error('[DepositModal] Bad response:', res.status, errorText)
                alert(t('deposit.invalidResponse'))
                return
            }

            // Попытка распарсить JSON
            let body
            try {
                body = await res.json()
            } catch (jsonErr) {
                console.error('[DepositModal] Failed to parse JSON:', jsonErr)
                alert(t('deposit.invalidResponse'))
                return
            }

            const transactionData = body?.data

            if (transactionData && transactionData.reason) {
                const { reason } = transactionData
                setDepositInfo({ amount, reason })
            } else {
                console.error('[DepositModal] Invalid structure:', body)
                alert(t('deposit.invalidResponse'))
            }
        } catch (e) {
            console.error('[DepositModal] Network or unexpected error:', e)
            alert(t('deposit.failed'))
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text)
        alert(t('deposit.copied'))
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <h2>{t('deposit.title')}</h2>

                {!depositInfo ? (
                    <>
                        <div className="deposit-info-box">
                            <p><strong>{t('deposit.min')}</strong></p>
                            <p>{t('deposit.autoConfirm')}</p>
                            <p>{t('deposit.trackStatus')}</p>
                        </div>

                        <label>
                            {t('deposit.amount')}:
                            <input
                                type="text"
                                value={amount.toLocaleString('en-US').replace(/,/g, ' ')}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\s/g, '')
                                    const parsed = Number(raw)
                                    if (!isNaN(parsed)) setAmount(parsed)
                                }}
                                onBlur={() => {
                                    if (amount < 100_000_000) {
                                        setAmount(100_000_000)
                                    }
                                }}
                                inputMode="numeric"
                                pattern="[0-9\s]*"
                            />

                        </label>

                        <button onClick={handleSubmit} disabled={loading}>
                            {loading ? t('deposit.creating') : t('deposit.create')}
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
                                <span className="label">{t('deposit.to')}:</span>
                                <span className="value">EVE Board [EVEBD]</span>
                                <button className="copy-btn" onClick={() => handleCopy('EVE Board')}>
                                    <FaCopy />
                                </button>
                            </div>

                            <div className="detail-line">
                                <span className="label">{t('deposit.amount')}:</span>
                                <span className="value">{depositInfo.amount.toLocaleString()} ISK</span>
                                <button className="copy-btn"
                                        onClick={() => handleCopy(depositInfo.amount.toLocaleString())}>
                                    <FaCopy />
                                </button>
                            </div>

                            <div className="detail-line">
                                <span className="label">{t('deposit.reason')}:</span>
                                <code className="value">{depositInfo.reason}</code>
                                <button className="copy-btn" onClick={() => handleCopy(depositInfo.reason)}>
                                    <FaCopy />
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
