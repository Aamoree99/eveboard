import { useNavigate } from 'react-router-dom'
import './LegalModal.scss'

const PrivacyModal = () => {
    const navigate = useNavigate()

    return (
        <div className="legal-modal-overlay" onClick={() => navigate(-1)}>
            <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
                <h1>Privacy Policy</h1>
                <p>Last updated: April 2, 2025</p>

                <h2>1. What we access</h2>
                <p>We request limited data from your EVE Online character via ESI scopes — only what's required for platform functionality:</p>

                <ul>
                    <li>
                        <strong>publicData</strong> — basic character info: ID, name, avatar.
                    </li>
                    <li>
                        <strong>esi-location.read_location.v1</strong> — current system (for live contract updates and
                        optional tracking).
                    </li>
                    <li>
                        <strong>esi-location.read_ship_type.v1</strong> — your active ship type (optional, for future
                        features).
                    </li>
                    <li>
                        <strong>esi-location.read_online.v1</strong> — online status (to help show availability in ops).
                    </li>
                    <li>
                        <strong>esi-wallet.read_character_wallet.v1</strong> — your ISK balance (used to create/accept
                        contracts).
                    </li>
                    <li>
                        <strong>esi-wallet.read_corporation_wallet.v1</strong> — requested by default for all users.
                        However, it's <em>only</em> used if your account has the <strong>ADMIN</strong> role, to
                        validate and process corp-level ISK withdrawals. All other users’ corp wallet data is ignored
                        and never stored.
                    </li>
                    <li>
                        <strong>esi-killmails.read_killmails.v1</strong> — confirms kills when required by a contract.
                    </li>
                    <li>
                        <strong>esi-ui.open_window.v1</strong> — lets us open in-game info (e.g., show targets or
                        locations via the EVE client).
                    </li>
                    <li>
                        <strong>esi-ui.write_waypoint.v1</strong> — lets us add waypoints automatically in your client.
                    </li>
                </ul>

                <h2>2. Why we use it</h2>
                <p>We use this data only to:</p>
                <ul>
                    <li>Authenticate your EVE character and display your profile</li>
                    <li>Enable and verify in-game contracts and wallet operations</li>
                    <li>Support real-time updates and in-client interactions</li>
                </ul>

                <h2>3. What we don’t do</h2>
                <ul>
                    <li>We do <strong>not</strong> read your mails, chats, assets, or PLEX</li>
                    <li>
                        We do <strong>not</strong> use corporate wallet data unless you're an authorized admin on the
                        platform.
                    </li>
                    <li>We do <strong>not</strong> share or sell any of your data</li>
                </ul>

                <h2>4. Storage & security</h2>
                <p>
                    Access tokens are stored securely and automatically refreshed via OAuth. All character-related data is used strictly within EVE Board and never exposed to third parties.
                </p>
            </div>
        </div>
    )
}

export default PrivacyModal
