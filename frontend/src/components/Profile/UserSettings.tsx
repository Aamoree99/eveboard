import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Api } from '../../api/Api'

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
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTheme(e.target.value as 'dark' | 'light')
    }

    const handleBecomePerformer = () => {
        setShowModal(true)
    }

    const handleConfirm = async () => {
        try {
            setIsLoading(true)
            await api.user.userControllerBecomeExecutor()
            await reloadUser()
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
        user?.role === 'TESTER'

    return (
        <div className="user-settings">
            <h3>Settings</h3>

            <div className="setting-item">
                <label>Theme:</label>
                <select value={theme} onChange={handleThemeChange}>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                </select>
            </div>

            {!isExecutor && (
                <button className="user-settings__button" onClick={handleBecomePerformer}>
                    Become an Executor
                </button>
            )}

            <button className="user-settings__button logout" onClick={logout}>
                Logout
            </button>

            {showModal && (
                <div className="user-settings__modal-backdrop">
                    <div className="user-settings__modal">
                        <h4 className="user-settings__modal-title">
                            Do you want to become an executor?
                        </h4>
                        <p className="user-settings__modal-text">
                            You will still be able to create orders.
                        </p>
                        <div className="user-settings__modal-actions">
                            <button onClick={handleConfirm} disabled={isLoading}>
                                {isLoading ? 'Submitting...' : 'Confirm'}
                            </button>
                            <button onClick={() => setShowModal(false)} disabled={isLoading}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserSettings
