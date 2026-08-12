import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [confirmationPending, setConfirmationPending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error } = await signUp({ email, password, fullName, phoneNumber })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }

    // If "Confirm email" is enabled in Supabase, there's no active
    // session yet - the account exists but needs email confirmation
    // before it can log in. Tell the user instead of silently
    // redirecting them somewhere that won't work yet.
    if (!data.session) {
      setConfirmationPending(true)
      return
    }

    navigate('/')
  }

  if (confirmationPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card w-full max-w-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Check your email</h1>
          <p className="text-charcoal/60">
            We sent a confirmation link to <strong>{email}</strong>. Click it, then come back
            and sign in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold mb-1">Create Account</h1>
        <p className="text-charcoal/60 mb-6">Sign up as a customer of Dela Cruz Meat Shop</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phoneNumber">
              Phone number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="09xxxxxxxxx"
              className="input-field"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-oxblood bg-oxblood/10 border border-oxblood/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-sm text-charcoal/60 mt-6 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-oxblood font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
