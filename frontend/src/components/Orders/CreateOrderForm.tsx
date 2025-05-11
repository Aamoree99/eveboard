import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Api } from '../../api/Api'
import type { OrderType } from '../../types/models'
import './CreateOrderForm.scss'
import { useAuth } from '../../context/AuthContext'
import FancyDatePicker from "../ui/FancyDatePicker.tsx";

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

type Props = {
    onClose: () => void
    onCreated: () => void
}

type SystemOption = { id: number; name: string }
type OrderTypeOption = { value: OrderType; label: string }

const MIN_ORDER_PRICE = 100_000_000
const ANONYMITY_EXTRA = 50_000_000
const PROMOTION_WEEKLY_COST = 100_000_000

const CreateOrderForm = ({ onClose, onCreated }: Props) => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const isEarlyBird = user?.role === 'EARLY_BIRD'
    const localBalance = Number(user?.balance ?? 0)

    const [form, setForm] = useState({
        title: '',
        description: '',
        requirements: '',
        price: String(MIN_ORDER_PRICE),
        deadline: '',
        type: '' as OrderType,
        isAnonymous: false,
        isPromoting: false,
        promotingUntil: '',
    })

    const [systemQuery, setSystemQuery] = useState('')
    const [systemOptions, setSystemOptions] = useState<SystemOption[]>([])
    const [selectedSystem, setSelectedSystem] = useState<SystemOption | null>(null)
    const [orderTypes, setOrderTypes] = useState<OrderTypeOption[]>([])
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const numericPrice = Number(form.price || '0')

    const promoPrice = (() => {
        if (isEarlyBird || !form.isPromoting || !form.promotingUntil) return 0
        const now = new Date()
        const until = new Date(form.promotingUntil)
        const msDiff = until.getTime() - now.getTime()
        const days = Math.ceil(msDiff / (1000 * 60 * 60 * 24))
        const weeks = Math.ceil(days / 7)
        return weeks * PROMOTION_WEEKLY_COST
    })()

    const totalPrice = numericPrice + (form.isAnonymous ? ANONYMITY_EXTRA : 0) + promoPrice

    useEffect(() => {
        api.order.orderControllerGetTypes()
            .then(async (res) => {
                const json = await res.json()
                const types = json?.data || json
                if (Array.isArray(types)) {
                    setOrderTypes(types)
                    if (!form.type && types.length > 0) {
                        setForm((prev) => ({ ...prev, type: types[0].value }))
                    }
                }
            })
            .catch(console.error)
    }, [])

    useEffect(() => {
        const fetchSystems = async () => {
            if (systemQuery.length < 3) {
                setSystemOptions([])
                return
            }
            try {
                const res = await api.system.systemControllerSearch({ q: systemQuery })
                const json = await res.json()
                setSystemOptions(Array.isArray(json) ? json : [])
            } catch (err) {
                console.error('System search failed', err)
            }
        }

        const delay = setTimeout(fetchSystems, 300)
        return () => clearTimeout(delay)
    }, [systemQuery])

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const target = e.target
        const name = target.name
        const value =
            target instanceof HTMLInputElement && target.type === 'checkbox'
                ? target.checked
                : target.value

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const handlePriceBlur = () => {
        const numeric = Number(form.price || '0')
        if (numeric < MIN_ORDER_PRICE) {
            setForm((prev) => ({ ...prev, price: String(MIN_ORDER_PRICE) }))
        }
    }

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        if (!/^\d*$/.test(raw)) return
        setForm((prev) => ({ ...prev, price: raw }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (numericPrice < MIN_ORDER_PRICE) {
            return setError(`Minimum price is ${MIN_ORDER_PRICE.toLocaleString()} ISK`)
        }

        if (totalPrice > localBalance) {
            return setError(`Not enough ISK. You need ${totalPrice.toLocaleString()} ISK`)
        }

        const payload = {
            ...form,
            price: numericPrice,
            systemId: selectedSystem?.id,
            deadline: form.deadline || undefined,
            isPromoting: isEarlyBird ? false : form.isPromoting,
            promotingUntil: isEarlyBird ? undefined : (form.isPromoting ? form.promotingUntil : undefined),
        }

        setLoading(true)
        try {
            const res = await api.order.orderControllerCreate(payload, { secure: true })
            const data = res.data as unknown as { id: string }

            onCreated()
            navigate(`/order?orderId=${data.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="create-order-modal-overlay" onClick={onClose}>
            <div className="create-order-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>
                <h2>Create New Order</h2>

                <form className="create-order-form" onSubmit={handleSubmit}>
                    <label>
                        Order Type
                        <select name="type" value={form.type} onChange={handleChange} required>
                            {orderTypes.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Title
                        <input
                            name="title"
                            placeholder="Title"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Description
                        <textarea
                            name="description"
                            placeholder="Detailed description"
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                    </label>

                    <label>
                        Requirements
                        <textarea
                            name="requirements"
                            placeholder="Any specific requirements?"
                            value={form.requirements}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        System (optional)
                        <div className="relative-wrapper">
                            <input
                                placeholder="System"
                                value={selectedSystem?.name || systemQuery}
                                onChange={(e) => {
                                    setSystemQuery(e.target.value)
                                    setSelectedSystem(null)
                                }}
                            />
                            {systemOptions.length > 0 && !selectedSystem && (
                                <ul className="autocomplete-list">
                                    {systemOptions.map((sys) => (
                                        <li key={sys.id} onClick={() => {
                                            setSelectedSystem(sys)
                                            setSystemQuery(sys.name)
                                        }}>
                                            {sys.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </label>

                    <div className="double-row">
                        <label>
                            Deadline
                            <FancyDatePicker
                                value={form.deadline}
                                onChange={(date) => {
                                    setForm((prev) => ({...prev, deadline: date}))
                                }}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </label>

                        <label>
                            Price
                            <div className="price-isk">
                                <input
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    onChange={handlePriceChange}
                                    onBlur={handlePriceBlur}
                                    placeholder="Price"
                                    required
                                    min={MIN_ORDER_PRICE}
                                />
                                <span>ISK</span>
                            </div>
                        </label>
                    </div>

                    <div className="checkbox-row">
                        <input
                            type="checkbox"
                            name="isAnonymous"
                            id="isAnonymous"
                            checked={form.isAnonymous}
                            onChange={handleChange}
                            className="styled-checkbox"
                        />
                        <label htmlFor="isAnonymous">
                            Post as Anonymous (Costs +50M ISK)
                        </label>
                    </div>

                    {!isEarlyBird && (
                        <>
                            <div className="checkbox-row">
                                <input
                                    type="checkbox"
                                    name="isPromoting"
                                    id="isPromoting"
                                    checked={form.isPromoting}
                                    onChange={handleChange}
                                    className="styled-checkbox"
                                />
                                <label htmlFor="isPromoting">
                                    Promote to Top (100M ISK per 7 days)
                                </label>
                            </div>

                            {form.isPromoting && (
                                <label>
                                    Promote Until
                                    <FancyDatePicker
                                        value={form.promotingUntil}
                                        onChange={(date) => {
                                            setForm((prev) => ({...prev, promotingUntil: date}))
                                        }}
                                        min={new Date().toISOString().split('T')[0]}
                                        max={form.deadline || undefined}
                                    />
                                </label>
                            )}
                        </>
                    )}

                    {error && <p className="error">{error}</p>}

                    <button type="submit" disabled={loading || totalPrice < MIN_ORDER_PRICE}>
                        {loading
                            ? 'Creating...'
                            : `Create for ${totalPrice.toLocaleString()} ISK`}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreateOrderForm
