import { useState } from 'react'
import './UserProfile.scss'

import UserHeader from './UserHeader'
import UserOrders from './UserOrders'
import UserReviews from './UserReviews'
import UserSettings from './UserSettings'
import UserTransactions from './UserTransactions'

import { User } from '../../types/models'
import { useTranslation } from 'react-i18next'

interface Props {
    user: User
    isOwnProfile: boolean
}

const UserProfile = ({ user, isOwnProfile }: Props) => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<'orders' | 'reviews' | 'transactions'>('orders')

    const handleRatingClick = () => {
        setActiveTab('reviews')
    }

    return (
        <div className="user-profile">
            <div className="user-profile__sidebar">
                <UserHeader
                    user={user}
                    isOwnProfile={isOwnProfile}
                    onRatingClick={handleRatingClick}
                />
                {isOwnProfile && <UserSettings />}
            </div>

            <div className="user-profile__main">
                <div className="user-profile__tabs">
                    <button
                        className={activeTab === 'orders' ? 'active' : ''}
                        onClick={() => setActiveTab('orders')}
                    >
                        {t('profile.tabs.orders')}
                    </button>
                    <button
                        className={activeTab === 'reviews' ? 'active' : ''}
                        onClick={() => setActiveTab('reviews')}
                    >
                        {t('profile.tabs.reviews')}
                    </button>
                    {isOwnProfile && (
                        <button
                            className={activeTab === 'transactions' ? 'active' : ''}
                            onClick={() => setActiveTab('transactions')}
                        >
                            {t('profile.tabs.transactions')}
                        </button>
                    )}
                </div>

                <div className="user-profile__content">
                    {activeTab === 'orders' && (
                        <UserOrders user={user} isOwnProfile={isOwnProfile} />
                    )}
                    {activeTab === 'reviews' && <UserReviews userId={user.id} />}
                    {activeTab === 'transactions' && isOwnProfile && <UserTransactions />}
                </div>
            </div>
        </div>
    )
}

export default UserProfile
