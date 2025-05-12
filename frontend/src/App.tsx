import { Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import AuthSuccessPage from './pages/AuthSuccessPage'
import AuthFailedPage from './pages/AuthFailedPage'
import OrdersPage from './pages/OrdersPage'
import OrderModalFromUrl from './components/Orders/OrderModalFromUrl'
import TermsModal from './pages/TermsModal'
import PrivacyModal from './pages/PrivacyModal'
import MyOrdersPage from './pages/MyOrdersPage'
import UserPage from './pages/UserPage'
import AdminWithdrawsPage from './pages/AdminWithdraws'
import NotFoundPage from "./pages/NotFoundPage.tsx";

const App = () => {
    const location = useLocation()
    const state = location.state as { background?: Location }
    const background = state?.background

    return (
        <>
            <Routes location={background || location}>
                {/* Публичные */}
                <Route path="/auth-success" element={<AuthSuccessPage />} />
                <Route path="/auth-failed" element={<AuthFailedPage />} />
                <Route path="/auth-error" element={<AuthFailedPage />} />
                <Route path="/order" element={<OrderModalFromUrl />} />

                {/* Ранее защищённые — теперь публичные */}
                <Route path="/" element={<HomePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my" element={<MyOrdersPage />} />
                <Route path="/user/:userId" element={<UserPage />} />
                <Route path="/orders" element={<OrdersPage />} />

                <Route path="/admin/withdraws" element={<AdminWithdrawsPage />} />

                <Route path="*" element={<NotFoundPage />} />

            </Routes>

            {/* Модалки */}
            {background && (
                <Routes>
                    <Route path="/terms" element={<TermsModal />} />
                    <Route path="/privacy" element={<PrivacyModal />} />
                    <Route path="/order" element={<OrderModalFromUrl />} />
                </Routes>
            )}
        </>
    )
}

export default App
