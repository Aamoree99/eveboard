import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Api } from '../api/Api'

const api = new Api({ baseUrl: import.meta.env.VITE_API_URL })

const DiscordCallback = () => {
    const [params] = useSearchParams()
    const navigate = useNavigate()

    useEffect(() => {
        const code = params.get('code')
        const token = localStorage.getItem('token')

        if (!code || !token) {
            navigate('/')
            return
        }

        api.auth.authControllerLinkDiscord(
            { id: code },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        ).then(() => {
            alert('✅ Discord linked!')
            navigate('/')
        }).catch(() => {
            alert('❌ Failed to link Discord')
            navigate('/')
        })
    }, [params, navigate])

    return <p>Linking your Discord... please wait.</p>
}

export default DiscordCallback
