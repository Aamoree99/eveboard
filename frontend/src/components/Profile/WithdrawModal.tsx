import { useState } from 'react'
import './TransModal.scss'
import { Api } from '../../api/Api'
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
    userBalance: number
}

interface WithdrawResponseData {
    transactionId: string
    requestedAmount: number
    fee: number
    payout: number
    reason: string
}

const MIN_WITHDRAW = 500_000_000
const FEE_PERCENT = 10

const WithdrawModal = ({ onClose, userBalance }: Props) => {
    const { t } = useTranslation()
    const [amountStr, setAmountStr] = useState('500000000')
    const [loading, setLoading] = useState(false)
    const [response, setResponse] = useState<WithdrawResponseData | null>(null)

    const amount = Number(amountStr || '0')
    const isValid = amount >= MIN_WITHDRAW && amount <= userBalance
    const fee = Math.ceil((amount * FEE_PERCENT) / 100)
    const payout = amount - fee

    const handleSubmit = async () => {
        if (!isValid) return
        setLoading(true)
        try {
            const res = await api.transaction.transactionControllerRequestWithdraw({ amount })
            const data = res.data as unknown as WithdrawResponseData
            setResponse(data)
        } catch (e) {
            console.error('[WithdrawModal] Withdraw failed:', e)
            alert(t('withdraw.failed'))
        } finally {
            setLoading(false)
        }
    }

    const fixAmountOnBlur = () => {
        let value = Number(amountStr || '0')
        if (value < MIN_WITHDRAW) value = MIN_WITHDRAW
        if (value > userBalance) value = userBalance
        setAmountStr(value.toString())
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>
                <h2>{t('withdraw.title')}</h2>

                {!response ? (
                    <>
                        <label>
                            {t('withdraw.amountLabel', { max: userBalance.toLocaleString() })}
                            <input
                                type="text"
                                inputMode="numeric"
                                value={amountStr}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (/^\d*$/.test(val)) setAmountStr(val)
                                }}
                                onBlur={fixAmountOnBlur}
                            />
                        </label>

                        <div className="fee-info">
                            {t('withdraw.fee', { fee: fee.toLocaleString() })}
                        </div>

                        <div className="payout">
                            {t('withdraw.youWillReceive')} <strong>{payout.toLocaleString()} ISK</strong>
                        </div>

                        {!isValid && (
                            <p className="error">
                                {t('withdraw.limits', {
                                    min: MIN_WITHDRAW.toLocaleString(),
                                    max: userBalance.toLocaleString()
                                })}
                            </p>
                        )}

                        <button onClick={handleSubmit} disabled={loading || !isValid}>
                            {loading ? t('withdraw.processing') : t('withdraw.button')}
                        </button>
                    </>
                ) : (
                    <div className="withdraw-success">
                        <p>{t('withdraw.success')}</p>
                        <p>
                            <strong>{response.payout.toLocaleString()} ISK</strong> {t('withdraw.sent')}
                            <br />
                            <small>({t('withdraw.feeLabel')}: {response.fee.toLocaleString()} ISK)</small>
                        </p>
                        <p className="reason">
                            {t('withdraw.reason')}<br />
                            <code>{response.reason}</code>
                        </p>
                        <button onClick={onClose}>{t('withdraw.close')}</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default WithdrawModal
