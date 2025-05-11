import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthFailedPage = () => {
    const navigate = useNavigate()

    useEffect(() => {
        console.warn('[AuthFailedPage] Redirecting to home...')
        localStorage.removeItem('token')
        navigate('/', { replace: true })
    }, [navigate])

    return null
}

export default AuthFailedPage
