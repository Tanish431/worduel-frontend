import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { api } from '../lib/api';
import { useAuthStore } from '../store';

export function LoginPage() {
    const navigate = useNavigate()
    const { user, authReady, setAuth }= useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        setLoading(true)
        setError(null)
        try {
            const { token, user } = await api.login(email, password)
            setAuth(user, token)
            navigate('/')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!authReady) return null
    if (user) return <Navigate to="/" replace />

    return (
        <div className='auth-page'>
            <div className='auth-card'>
                <h2>Log in</h2>
                {error && <p className='auth-card__error'>{error}</p>}
                <input className="input" type="email" placeholder="Email"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="input" type="password" placeholder="Password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submit()} />
                <button className="btn btn--primary" onClick={submit} disabled={loading}>
                    {loading ? 'Logging in…' : 'Log in'}
                </button>
                <div className="auth-card__divider" aria-hidden="true">
                    <span>or</span>
                </div>
                <GoogleAuthButton disabled={loading} label="Continue with Google" />
                <p className="auth-card__footer">
                    No account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    )
}
