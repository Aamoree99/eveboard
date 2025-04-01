import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from '../types/models'
import { Api } from '../api/Api'

interface AuthContextType {
    user: User | null
    loading: boolean
    setUser: (user: User | null) => void
    logout: () => void
    fetchUser: () => void
    reloadUser: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    setUser: () => {},
    logout: () => {},
    fetchUser: () => {},
    reloadUser: () => {},
})

export const useAuth = () => useContext(AuthContext)

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    const logout = useCallback(() => {
        console.log('[Auth] Logging out')
        localStorage.removeItem('token')
        localStorage.removeItem('balance')
        localStorage.removeItem('user')
        setUser(null)
        navigate('/auth-failed', { replace: true })
    }, [navigate])

    const fetchUser = useCallback(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            setLoading(false)
            return
        }

        api.user
            .userControllerGetMe()
            .then(async (res) => {
                const data = (await res.json()) as User
                setUser(data)
                localStorage.setItem('balance', data.balance.toString())
                localStorage.setItem('user', JSON.stringify(data))
            })
            .catch(() => {
                logout()
            })
            .finally(() => setLoading(false))
    }, [logout])

    useEffect(() => {
        fetchUser()

        const interval = setInterval(() => {
            console.log('[Auth] Refreshing user info...')
            fetchUser()
        }, 5 * 60 * 1000) // refresh every 5 minutes

        return () => clearInterval(interval)
    }, [fetchUser])

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                setUser,
                logout,
                fetchUser,
                reloadUser: fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}
