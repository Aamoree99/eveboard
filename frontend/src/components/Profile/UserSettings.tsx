import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Theme, useTheme } from '../../context/ThemeContext'
import { Api } from '../../api/Api'
import { CustomSelect } from './ThemeSelect.tsx'
import { LanguageSelect } from './LanguageSelect.tsx'
import { useTranslation } from 'react-i18next'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const UserSettings = () => {
    const { logout, user, reloadUser } = useAuth()
    const { theme, setTheme } = useTheme()
    const { t } = useTranslation()
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'DISCORD_LINK') {
                const discordId = event.data.payload.id
                try {
                    await api.auth.authControllerLinkDiscord({ id: discordId })
                    await reloadUser()
                } catch (err) {
                    console.error('[UserSettings] Failed to link Discord:', err)
                }
            }
        }
        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [reloadUser])

    const handleLinkDiscord = () => {
        const redirectUri = import.meta.env.VITE_DISCORD_REDIRECT_URI
        const url = `https://discord.com/oauth2/authorize?client_id=1356284491966189588&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify%20guilds.join`
        window.open(url, '_blank', 'width=500,height=600')
    }

    const handleBecomePerformer = () => setShowModal(true)

    const handleConfirm = async () => {
        try {
            setIsLoading(true)
            await api.user.userControllerBecomeExecutor()
            reloadUser()
            setShowModal(false)
        } catch (error) {
            console.error('[UserSettings] Failed to become executor:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const isExecutor =
        user?.role === 'EXECUTOR' ||
        user?.role === 'ADMIN' ||
        user?.role === 'TESTER' ||
        user?.role === 'EARLY_BIRD'

    return (
        <div className="user-settings">
            <h3>{t('settings.title')}</h3>

            <CustomSelect value={theme} onChange={(val) => setTheme(val as Theme)} />
            <LanguageSelect />

            {!user?.discordId && (
                <div className="setting-item">
                    <label>{t('settings.discord')}</label>
                    <button className="user-settings__button discord" onClick={handleLinkDiscord}>
                        {t('settings.linkDiscord')}
                    </button>
                </div>
            )}

            {!isExecutor && (
                <button className="user-settings__button" onClick={handleBecomePerformer}>
                    {t('settings.becomeExecutor')}
                </button>
            )}

            <button className="user-settings__button logout" onClick={() => setShowLogoutModal(true)}>
                {t('settings.logout')}
            </button>

            {showLogoutModal && (
                <div className="user-settings__modal-backdrop">
                    <div className="user-settings__modal">
                        <h4 className="user-settings__modal-title">
                            {t('settings.logoutConfirmTitle')}
                        </h4>
                        <p className="user-settings__modal-text">
                            {t('settings.logoutConfirmText')}
                        </p>
                        <div className="user-settings__modal-actions">
                            <button onClick={logout}>{t('settings.logoutYes')}</button>
                            <button onClick={() => setShowLogoutModal(false)}>{t('settings.cancel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="user-settings__modal-backdrop">
                    <div className="user-settings__modal">
                        <h4 className="user-settings__modal-title">
                            {t('settings.executorConfirmTitle')}
                        </h4>
                        <p className="user-settings__modal-text">
                            {t('settings.executorConfirmText')}
                        </p>
                        <div className="user-settings__modal-actions">
                            <button onClick={handleConfirm} disabled={isLoading}>
                                {isLoading ? t('settings.submitting') : t('settings.confirm')}
                            </button>
                            <button onClick={() => setShowModal(false)} disabled={isLoading}>
                                {t('settings.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserSettings
