import { useAuth } from '../../contexts/AuthContext'

export default function OwnerDashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-charcoal/60">Welcome, {profile?.full_name}</p>
        </div>
        <button onClick={signOut} className="btn-secondary">
          Sign Out
        </button>
      </header>

      <div className="card p-6">
        <p className="text-charcoal/60">
          Sales reports, inventory, and staff management land here in Phase 4.
        </p>
      </div>
    </div>
  )
}
