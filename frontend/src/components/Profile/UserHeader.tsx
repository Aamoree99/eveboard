import { useState } from 'react'
import type { User } from '../../types/models'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { Api } from '../../api/Api'
import { useAuth } from '../../context/AuthContext.tsx'
import { useTranslation } from 'react-i18next'

interface Props {
    user: User
    isOwnProfile: boolean
    onRatingClick?: () => void
}

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const UserHeader = ({ user, isOwnProfile, onRatingClick }: Props) => {
    const [showDepositModal, setShowDepositModal] = useState(false)
    const [showWithdrawModal, setShowWithdrawModal] = useState(false)
    const { reloadUser } = useAuth()
    const [referralCode, setReferralCode] = useState('')
    const [referralSubmitted, setReferralSubmitted] = useState(false)
    const [referralError, setReferralError] = useState<string | null>(null)
    const { t } = useTranslation()

    const handleSubmitReferral = async () => {
        if (!referralCode.trim()) return
        try {
            await api.user.userControllerSetReferral({ code: referralCode.trim() })
            setReferralSubmitted(true)
            setReferralError(null)
            reloadUser()
        } catch (err: any) {
            console.error('Referral error:', err)
            const message =
                err?.response?.message || err?.statusText || t('user.referralUnknownError')
            setReferralError(message)
        }
    }

    return (
        <>
            <div className="user-header">
                <div className="user-header__top">
                    <img
                        src={user.avatar || '/fallback-avatar.png'}
                        alt="avatar"
                        className="avatar"
                    />
                    <div className="user-main-info">
                        <h2>{user.name || t('user.noName')}</h2>
                        <div className="role-tag-wrapper">
                            <p className="role-tag">
                                {user.role}
                                {user.role === 'PENDING' && (
                                    <span className="emoji-warning" title={t('user.discordRequired')}>❗</span>
                                )}
                            </p>
                            {user.role === 'PENDING' && (
                                <div className="tooltip">{t('user.pleaseLinkDiscord')}</div>
                            )}
                        </div>
                        <div
                            className={`rating ${isOwnProfile ? 'clickable' : ''}`}
                            onClick={onRatingClick}
                        >
                            ★ {typeof user.rating === 'number' ? user.rating.toFixed(2) : 'N/A'}
                        </div>
                    </div>
                </div>

                {isOwnProfile && (
                    <div className="balance-block">
                        <div className="balance">
                            {user.balance
                                ? `${Number(BigInt(user.balance)).toLocaleString()} ISK`
                                : '0 ISK'}
                        </div>
                        <div className="buttons">
                            <button onClick={() => setShowDepositModal(true)}>
                                {t('user.topUp')}
                            </button>
                            {Number(user.balance) >= 500_000_000 && (
                                <button onClick={() => setShowWithdrawModal(true)}>
                                    {t('user.withdraw')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {isOwnProfile && !user.referralId && !referralSubmitted && (
                    <div className="referral-block">
                        <p className="referral-label">{t('user.haveReferral')}</p>
                        <div className="referral-form">
                            <input
                                type="text"
                                placeholder={t('user.enterCode')}
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                            />
                            <button onClick={handleSubmitReferral}>{t('user.apply')}</button>
                        </div>
                        {referralError && <p className="referral-error">{referralError}</p>}
                    </div>
                )}

                {isOwnProfile && referralSubmitted && (
                    <div className="referral-success">
                        ✅ {t('user.referralSuccess')}
                    </div>
                )}
            </div>

            {showDepositModal && (
                <DepositModal
                    onClose={() => {
                        setShowDepositModal(false)
                        reloadUser()
                    }}
                />
            )}

            {showWithdrawModal && (
                <WithdrawModal
                    onClose={() => {
                        setShowWithdrawModal(false)
                        reloadUser()
                    }}
                    userBalance={Number(user.balance)}
                />
            )}
        </>
    )
}

export default UserHeader
