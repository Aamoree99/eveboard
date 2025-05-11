// CreateOrderModal.tsx
import { createPortal } from 'react-dom'
import CreateOrderForm from './CreateOrderForm'
import './CreateOrderModal.scss'

type Props = {
    onClose: () => void
    onCreated: () => void
}

const CreateOrderModal = ({ onClose, onCreated }: Props) => {
    return createPortal(
        <div className="create-order-overlay" onClick={onClose}>
            <div className="create-order-container" onClick={(e) => e.stopPropagation()}>
                <CreateOrderForm onClose={onClose} onCreated={onCreated} />
            </div>
        </div>,
        document.body
    )
}

export default CreateOrderModal
