import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../store'

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const { token, user } = await api.register(username, email, password)
      setAuth(user, token)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create account</h2>
        {error && <p className="auth-card__error">{error}</p>}
        <input className="input" placeholder="Username"
          value={username} onChange={(e) => setUsername(e.target.value)} />
        <input className="input" type="email" placeholder="Email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()} />
        <button className="btn btn--primary" onClick={submit} disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
        <p className="auth-card__footer">
          Have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}