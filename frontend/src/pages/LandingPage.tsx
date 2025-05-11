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
            `https://discord.com/oauth2/authorize?client_id=1356284491966189588&response_type=code&redirect_uri=${encodeURIComponent('https://eveboard.space/api/auth/discord/callback')}&scope=identify%20guilds.join`,
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
                <p className="tagline">
                    The first fully-featured contract platform for elite capsuleers. Precision-crafted for those who operate in the shadows, shape empires, and define the fate of New Eden.
                </p>

                <div className="countdown">
                    <div><span>{timeLeft.days}</span><label>d</label></div>
                    <div><span>{timeLeft.hours}</span><label>h</label></div>
                    <div><span>{timeLeft.minutes}</span><label>m</label></div>
                    <div><span>{timeLeft.seconds}</span><label>s</label></div>
                </div>

                <div className="eve-board-intro">
                    <h2 className="eve-board-intro__title">EVE Board. Designed for the elite.</h2>

                    <div className="eve-board-intro__blocks">
                        <div className="intro-block">
                            <h3>Elite Missions</h3>
                            <p>Track wormholes, sabotage routes, extract under fire. Real ops. Real stakes.</p>
                        </div>

                        <div className="intro-block">
                            <h3>End-to-End Tracking</h3>
                            <p>Deadlines. Updates. Delivery confirms. Every assignment tracked, start to finish.</p>
                        </div>

                        <div className="intro-block">
                            <h3>Escrow Protected</h3>
                            <p>ISK held safely until completion. Disputes? Neutral arbiter, no drama.</p>
                        </div>

                        <div className="intro-block">
                            <h3>Fast Withdrawals</h3>
                            <p>Earn ISK to your profile. Withdraw to your character. Instant. Secure.</p>
                        </div>

                        <div className="intro-block">
                            <h3>Reputation System</h3>
                            <p>Grow your rank. Earn badges. Unlock classified ops. Your name carries weight.</p>
                        </div>

                        <div className="intro-block">
                            <h3>Built by Veterans</h3>
                            <p>No fluff. No filler. Just the platform New Eden’s finest operators deserve.</p>
                        </div>

                        <div className="intro-block accent">
                            <h3>Access Launching Soon</h3>
                            <p>Early contracts go live in May. Make your move — before others do.</p>
                        </div>
                    </div>
                </div>

                {user ? (
                    <div className="user-status">
                        <p>Logged in as <strong>{user.name}</strong></p>
                        {user.discordId ? (
                            <p>Your Discord account is successfully linked. You're eligible for early access.</p>
                        ) : (
                            <>
                                <p>To unlock early access features, please link your Discord account.</p>
                                <button className="landing__cta" onClick={handleLinkDiscord}>Link Discord</button>
                            </>
                        )}
                        <button className="landing__logout" onClick={handleLogout}>Log Out</button>
                    </div>
                ) : (
                    <div className="user-status">
                        <p>To begin, please log in with your EVE Online account.</p>
                        <EveLoginButton/>
                        <p>
                            By logging in, you agree to our{' '}
                            <Link to="/terms" state={{background: {pathname: location.pathname}}}>
                                Terms of Use
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" state={{background: {pathname: location.pathname}}}>
                                Privacy Policy
                            </Link>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default LandingPage
