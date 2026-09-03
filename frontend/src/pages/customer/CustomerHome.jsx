import { useAuth } from '../../contexts/AuthContext'

export default function CustomerHome() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dela Cruz Meat Shop</h1>
          <p className="text-charcoal/60">Welcome, {profile?.full_name}</p>
        </div>
        <button onClick={signOut} className="btn-secondary">
          Sign Out
        </button>
      </header>

      <div className="card p-6">
        <p className="text-charcoal/60">
          Queue status and pre-order form land here in Phases 2-3.
        </p>
      </div>
    </div>
  )
}
