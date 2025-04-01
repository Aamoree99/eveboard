import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './HomePage.scss'

const HomePage = () => {
    const { user } = useAuth()

    return (
        <Layout>
            <div className="home-page">
                <h1>Welcome to EVE Online Order Platform</h1>
                <p>Here you can create and take orders, manage your transactions, and more.</p>

                <div className="home-actions">
                    <h2>What would you like to do?</h2>
                    <div className="home-buttons">
                        <Link to="/orders">
                            <button className="primary-btn">View Orders</button>
                        </Link>

                        <Link to="/profile">
                            <button className="secondary-btn">
                                {user ? 'Go to Your Profile' : 'Start Taking Orders'}
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="home-why">
                    <h2>Why Choose Us?</h2>
                    <p>
                        We provide a secure and reliable platform for creating and completing orders in the EVE Online universe.
                        With our service, you can be sure that your transactions are safe, your work is recognized, and your
                        progress is rewarded.
                    </p>
                    <ul>
                        <li>Safe and secure transactions</li>
                        <li>Wide variety of orders available</li>
                        <li>Ratings and reviews to ensure trust</li>
                        <li>Payment on completion of tasks</li>
                        <li>Easy to use platform</li>
                    </ul>
                </div>
            </div>
        </Layout>
    )
}

export default HomePage
