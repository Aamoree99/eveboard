import './LandingPage.scss'
import {Link, useNavigate} from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { Api } from '../api/Api'
import EveLoginButton from "../components/EveLoginButton.tsx";


const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

const targetDate = new Date(Date.UTC(2025, 4, 0, 11, 0, 0)) // 14 апреля, 11:00 UTC

const getTimeLeft = () => {
    const now = new Date()
    const diff = targetDate.getTime() - now.getTime()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    }
}

const LandingPage = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [timeLeft, setTimeLeft] = useState(getTimeLeft())

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleLinkDiscord = () => {
        window.open(
            `https://discord.com/oauth2/authorize?client_id=1356284491966189588&response_type=code&redirect_uri=${encodeURIComponent('https://evebard.space/api/auth/discord/callback')}&scope=identify%20guilds.join`,
            '_blank',
            'width=500,height=600'
        )
    }

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'DISCORD_LINK') {
                console.log(event.data)
                api.auth.authControllerLinkDiscord({ id: event.data.payload.id })
                    .then(() => window.location.reload())
                    .catch((err: unknown) => {
                        console.error('❌ Failed to link Discord:', err)
                        alert('❌ Failed to link Discord')
                    })

            }
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [])

    const handleLogout = () => {
        logout()
        navigate('/', { replace: true })
    }

    return (
        <div className="landing">
            <div className="landing__content">
                <h1><span>EVE Board</span> is coming</h1>
                <p className="tagline">A refined contract system for elite EVE pilots. Built by players, for
                    players.</p>

                <div className="countdown">
                    <div><span>{timeLeft.days}</span><label>d</label></div>
                    <div><span>{timeLeft.hours}</span><label>h</label></div>
                    <div><span>{timeLeft.minutes}</span><label>m</label></div>
                    <div><span>{timeLeft.seconds}</span><label>s</label></div>
                </div>

                <div className="features">
                    <h2>🚀 What awaits you?</h2>
                    <ul>
                        <li>📦 Create contracts: kill, scout, scan, deliver, sabotage</li>
                        <li>🕵️‍♂️ Track progress, chat with executor, resolve disputes</li>
                        <li>💰 Earn ISK by completing real contracts from real pilots</li>
                        <li>🔐 Internal wallet with fast payout and escrow</li>
                        <li>📈 Ratings, history, achievement system</li>
                    </ul>
                </div>

                {user ? (
                    <div className="user-status">
                        <p>Logged in as <strong>{user.name}</strong></p>
                        {user.discordId ? (
                            <p>✅ Discord linked</p>
                        ) : (
                            <>
                                <p>🔗 Link your Discord to unlock early access</p>
                                <button className="landing__cta" onClick={handleLinkDiscord}>Link Discord</button>
                            </>
                        )}
                        <button className="landing__logout" onClick={handleLogout}>Log Out</button>
                    </div>
                ) : (
                    <div className="user-status">
                        <p>🔐 Please log in with your EVE account to continue</p>
                        <EveLoginButton/>
                        <p>
                            By logging in, you agree to our{' '}
                            <Link to="/terms" state={{background: location}}>Terms of Use</Link> and{' '}
                            <Link to="/privacy" state={{background: location}}>Privacy Policy</Link>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LandingPage
