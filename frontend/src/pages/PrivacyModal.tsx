import { useNavigate } from 'react-router-dom'
import './LegalModal.scss'

const PrivacyModal = () => {
    const navigate = useNavigate()

    return (
        <div className="legal-modal-overlay" onClick={() => navigate(-1)}>
            <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
                <h1>Privacy Policy</h1>
                <p>Last updated: March 28, 2025</p>

                <h2>1. What we collect and why</h2>
                <p>We request access to your EVE Online character data only for in-game features. Here's what and
                    why:</p>
                <ul>
                    <li><strong>Character ID, name, avatar</strong> — for profile and identification.</li>
                    <li><strong>Wallet balance</strong> — to create or accept orders.</li>
                    <li><strong>Killmails</strong> — to confirm completed contracts.</li>
                    <li><strong>Location, ship type, online status</strong> — for live tracking and routing (optional).
                    </li>
                    <li><strong>Corporation wallet & roles</strong> — <em>only for admins</em> managing funds.</li>
                    <li><strong>Contacts, standings, medals, FW stats</strong> — to display your achievements and trust
                        level.
                    </li>
                    <li><strong>Blueprints & agents</strong> — for logistics/manufacturing features.</li>
                    <li><strong>Chat channels, notifications</strong> — reserved for future integrations (optional).
                    </li>
                </ul>


                <h2>2. Use of info</h2>
                <p>Only for auth, orders, stats.</p>

                <h2>3. Security</h2>
                <p>Data is stored securely, never sold or shared.</p>
            </div>
        </div>
    )
}

export default PrivacyModal
