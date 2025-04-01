import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LandingPage from '../pages/LandingPage'

const ProtectedRoutes = () => {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return null // или <Loader />

    if (!user || user.role === 'PENDING') {
        if (location.pathname !== '/') {
            return <Navigate to="/" replace />
        }
        return <LandingPage />
    }

    return <Outlet />
}

export default ProtectedRoutes
