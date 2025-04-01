import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthSuccessPage = () => {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { fetchUser } = useAuth()

    useEffect(() => {
        const token = params.get('token')
        if (token) {
            localStorage.setItem('token', token)

            fetchUser()

            setTimeout(() => {
                navigate('/', { replace: true })
            }, 1000)
        } else {
            navigate('/', { replace: true })
        }
    }, [params, fetchUser, navigate])

    return <p>Authorizing...</p>
}

export default AuthSuccessPage
