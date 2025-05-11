import { useNavigate } from 'react-router-dom'
import './LegalModal.scss'

const TermsModal = () => {
    const navigate = useNavigate()

    return (
        <div className="legal-modal-overlay" onClick={() => navigate(-1)}>
            <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
                <h1>Terms of Service</h1>
                <p>Last updated: April 2, 2025</p>

                <h2>1. Using the platform</h2>
                <p>
                    By accessing EVE Board, you agree to use the platform responsibly and in accordance with these terms. If you do not accept these terms, do not use the platform.
                </p>

                <h2>2. Accounts & access</h2>
                <p>
                    Access requires authentication via EVE Online. You are responsible for all actions taken under your account, including contracts you create or accept.
                </p>

                <h2>3. Orders & payments</h2>
                <p>
                    All contracts are final once created or accepted. Payouts are processed through the internal wallet system. Platform fees may apply. Orders can be moderated or canceled by admins in case of abuse, fraud, or error.
                </p>

                <h2>4. Wallet & withdrawals</h2>
                <p>
                    ISK earned on the platform is stored in your internal balance. Withdrawals are subject to a service commission and may require identity verification. The platform is not liable for losses due to incorrect wallet info or in-game bans.
                </p>

                <h2>5. Conduct & restrictions</h2>
                <p>
                    Abusive behavior, multi-accounting, scamming, or misuse of platform features will result in suspension or permanent ban. We reserve the right to revoke access at any time.
                </p>

                <h2>6. Uptime & availability</h2>
                <p>
                    We strive for stable performance but do not guarantee uptime, error-free operation, or data availability. Scheduled or unscheduled downtime may occur.
                </p>

                <h2>7. Disputes</h2>
                <p>
                    If a dispute arises regarding a contract, users can submit a complaint. Disputes are reviewed manually by platform moderators. All decisions are final.
                </p>

                <h2>8. Changes to terms</h2>
                <p>
                    These terms may be updated at any time. Continued use of the platform after changes implies acceptance of the updated terms.
                </p>
            </div>
        </div>
    )
}

export default TermsModal
