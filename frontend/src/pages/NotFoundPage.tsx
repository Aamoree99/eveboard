// src/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'
import './NotFoundPage.scss'

const NotFoundPage = () => {
    return (
        <div className="not-found-page">
            <h1>🛰️ CONTRACT NOT FOUND</h1>
            <p>
                The requested operation could not be completed.<br />
                Contract may have expired, been cancelled, or never existed.
            </p>
            <p className="code">[Error Code: 404-NAV-NULLSEC]</p>
            <Link to="/">🡐 Return to Command Interface</Link>
        </div>
    )
}

export default NotFoundPage
