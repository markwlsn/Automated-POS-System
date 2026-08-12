import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Root route "/" - sends the logged-in user to their portal based on role.
 */
export default function RoleRouter() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal/60">
        Loading...
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />

  switch (profile.role) {
    case 'owner':
      return <Navigate to="/owner" replace />
    case 'staff':
      return <Navigate to="/staff" replace />
    default:
      return <Navigate to="/shop" replace />
  }
}
