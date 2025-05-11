import { useState } from 'react'
import type { User } from '../../types/models'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import { Api } from '../../api/Api'
import {useAuth} from "../../context/AuthContext.tsx"; // 👈 правильный путь, как у тебя в других файлах


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

    const handleSubmitReferral = async () => {
        if (!referralCode.trim()) return
        try {
            await api.user.userControllerSetReferral({ code: referralCode.trim() })
            setReferralSubmitted(true)
            setReferralError(null)
        } catch (err: unknown) {
            if (err instanceof Error) {
                setReferralError(err.message)
            } else if (typeof err === 'object' && err !== null && 'error' in err) {
                const maybe = err as { error?: { message?: string } }
                setReferralError(maybe.error?.message || 'Unknown error occurred')
            } else {
                setReferralError('Unexpected error')
            }
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
                        <h2>{user.name || 'No name'}</h2>
                        <div className="role-tag-wrapper">
                            <p className="role-tag">
                                {user.role}
                                {user.role === 'PENDING' && (
                                    <span className="emoji-warning" title="Подключите Discord">❗</span>
                                )}
                            </p>
                            {user.role === 'PENDING' && (
                                <div className="tooltip">Please link your Discord account</div>
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
                            <button onClick={() => setShowDepositModal(true)}>Top Up</button>
                            {Number(user.balance) >= 500_000_000 && (
                                <button onClick={() => setShowWithdrawModal(true)}>Withdraw</button>
                            )}
                        </div>
                    </div>
                )}

                {isOwnProfile && !user.referralId && !referralSubmitted && (
                    <div className="referral-block">
                        <p className="referral-label">Have a referral code?</p>
                        <div className="referral-form">
                            <input
                                type="text"
                                placeholder="Enter code"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value)}
                            />
                            <button onClick={handleSubmitReferral}>Apply</button>
                        </div>
                        {referralError && <p className="referral-error">{referralError}</p>}
                    </div>
                )}

                {isOwnProfile && referralSubmitted && (
                    <div className="referral-success">
                        ✅ Referral code successfully applied!
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
