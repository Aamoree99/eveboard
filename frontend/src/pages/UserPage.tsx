import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import UserProfile from '../components/Profile/UserProfile'
import { Api } from '../api/Api'
import { User } from '../types/models'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const UserPage = () => {
    const { userId } = useParams<{ userId: string }>()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return

        api.user.userControllerGetOne(userId)
            .then((res) => {
                const data = res as unknown as { data: User }
                setUser(data.data)
            })
            .catch((err) => {
                console.error('Failed to fetch user', err)
            })
            .finally(() => setLoading(false))
    }, [userId])

    return (
        <Layout>
            {loading ? (
                <p>Loading...</p>
            ) : user ? (
                <UserProfile user={user} isOwnProfile={false} />
            ) : (
                <p>User not found.</p>
            )}
        </Layout>
    )
}

export default UserPage
