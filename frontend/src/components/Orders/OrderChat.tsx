import { useEffect, useState, useRef } from 'react'
import { FiSend } from 'react-icons/fi'
import { Api } from '../../api/Api.ts'
import './OrderChat.scss'
import { useAuth } from '../../context/AuthContext.tsx'

const api = new Api({
    baseUrl: import.meta.env.VITE_API_URL,
    securityWorker: () => {
        const token = localStorage.getItem('token')
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {}
    },
})

interface Message {
    id: string
    text: string
    authorId: string
    createdAtFormatted: string
    author?: {
        id: string
        name: string
        avatar: string
    }
}

const OrderChat = ({ orderId }: { orderId: string }) => {
    const [messages, setMessages] = useState<Message[]>([])
    const [text, setText] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useAuth()
    const characterId = user?.characterId

    const fetchMessages = async () => {
        try {
            const res = await api.order.orderControllerGetMessages(orderId)
            const json = await res.json()
            const data = json.data as Message[]
            setMessages(data ?? [])
        } catch (e) {
            console.error('Failed to load messages', e)
            setMessages([])
        }
    }

    const sendMessage = async () => {
        if (!text.trim()) return
        try {
            await api.order.orderControllerSendMessage(orderId, { text })
            setText('')
            void fetchMessages()
        } catch (e) {
            console.error('Failed to send message', e)
        }
    }

    useEffect(() => {
        void fetchMessages()
        const interval = setInterval(() => {
            void fetchMessages()
        }, 5000)
        return () => clearInterval(interval)
    }, [orderId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <div className="order-chat">
            <div className="chat-messages">
                {messages.map((msg) => {
                    const isOwn = Number(msg.authorId) === Number(characterId)
                    return (
                        <div key={msg.id} className={`chat-message ${isOwn ? 'own' : 'incoming'}`}>
                            {!isOwn && msg.author && (
                                <a href={`/user/${msg.author.id}`} className="avatar">
                                    <img src={msg.author.avatar} alt={msg.author.name} />
                                </a>
                            )}

                            <div className="chat-bubble">
                                <span>{msg.text}</span>
                                <small>{msg.createdAtFormatted}</small>
                            </div>

                            {isOwn && msg.author && (
                                <a href={`/user/${msg.author.id}`} className="avatar">
                                    <img src={msg.author.avatar} alt={msg.author.name} />
                                </a>
                            )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type message..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') void sendMessage()
                    }}
                />
                <button onClick={sendMessage}><FiSend /></button>
            </div>
        </div>
    )
}

export default OrderChat
