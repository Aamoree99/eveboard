import './Header.scss'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiUser, FiSearch } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { Api } from '../api/Api'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface UserResult {
    id: string
    name: string
    avatar: string
}

const Header = () => {
    const { user } = useAuth()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<UserResult[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const fetch = setTimeout(async () => {
            try {
                const res = await api.user.userControllerSearchUsers({ q: query.trim() })
                const json = await res.json()
                setResults(json.data ?? [])
                setShowDropdown(true)
            } catch (e) {
                console.error('Search failed', e)
            }
        }, 300)

        return () => clearTimeout(fetch)
    }, [query])

    return (
        <header className="header">
            <div className="header__content">
                <div className="header__left">
                    <Link to="/" className="logo">EVE Board</Link>
                </div>

                <div className="header__right desktop-only">
                    <div className="nav-btns">
                        <NavLink to="/orders" className={({ isActive }) => isActive ? 'active' : ''}>Orders</NavLink>
                        <NavLink to="/my" className={({ isActive }) => isActive ? 'active' : ''}>My</NavLink>
                    </div>

                    <div className="search-bar">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setShowDropdown(results.length > 0)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        />
                        {showDropdown && results.length > 0 && (
                            <div className="search-dropdown">
                                {results.map(u => (
                                    <div
                                        key={u.id}
                                        className="search-result"
                                        onClick={() => navigate(`/user/${u.id}`)}
                                    >
                                        <img src={u.avatar} alt="avatar" />
                                        <span>{u.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link to="/profile" className="profile">
                        {user?.avatar ? (
                            <img src={user.avatar} alt="avatar" className="avatar" />
                        ) : (
                            <FiUser size={20} />
                        )}
                    </Link>
                </div>

                <div className="mobile-menu-icon mobile-only">☰</div>
            </div>
        </header>
    )
}

export default Header
