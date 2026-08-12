import { useAuth } from '../../contexts/AuthContext'

export default function StaffPOS() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen p-8">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Staff Counter</h1>
          <p className="text-charcoal/60">Signed in as {profile?.full_name}</p>
        </div>
        <button onClick={signOut} className="btn-secondary">
          Sign Out
        </button>
      </header>

      <div className="card p-6">
        <p className="text-charcoal/60">
          Checkout, weight entry, and queue controls land here next - this is Phase 1 of our
          build order.
        </p>
      </div>
    </div>
  )
}
