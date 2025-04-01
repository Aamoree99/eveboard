import { useNavigate } from 'react-router-dom'
import './LegalModal.scss'

const TermsModal = () => {
    const navigate = useNavigate()

    return (
        <div className="legal-modal-overlay" onClick={() => navigate(-1)}>
            <div className="legal-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={() => navigate(-1)}>×</button>
                <h1>Terms of Service</h1>
                <p>Last updated: March 28, 2025</p>

                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing or using this platform, you confirm that you have read, understood, and agreed to be bound by these Terms of Service.
                </p>

                <h2>2. User Conduct</h2>
                <p>
                    You are solely responsible for all activity associated with your account. Misuse, abuse, or violation of in-game rules or our policies may result in suspension or termination.
                </p>

                <h2>3. Orders and Payments</h2>
                <p>
                    All orders are final once confirmed. Prices are listed in ISK and may be subject to platform service fees. Platform admins reserve the right to moderate or cancel orders under exceptional circumstances.
                </p>

                <h2>4. Platform Use</h2>
                <p>
                    This service is provided "as is". We do our best to maintain reliability, but we make no guarantees regarding uptime, performance, or availability.
                </p>

                <h2>5. Refunds and Disputes</h2>
                <p>
                    Refunds are not provided automatically. In case of disputes, users may submit a complaint through the platform. All claims are reviewed manually.
                </p>

                <h2>6. Changes to Terms</h2>
                <p>
                    We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of the latest version.
                </p>
            </div>
        </div>
    )
}

export default TermsModal
