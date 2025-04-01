import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import LoginModal from '../components/LoginModal'
import UserProfile from '../components/Profile/UserProfile'

const ProfilePage = () => {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <Layout>
                <p>Loading...</p>
            </Layout>
        )
    }

    return (
        <Layout>
            {!user ? <LoginModal /> : <UserProfile user={user} isOwnProfile={true} />}
        </Layout>
    )
}

export default ProfilePage
