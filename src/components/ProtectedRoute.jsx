import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Wraps a page and only renders it if the user is logged in
 * and (optionally) has one of the allowed roles.
 *
 * Usage: <ProtectedRoute allowedRoles={['owner']}><OwnerDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal/60">
        Loading...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Not authorized</h2>
          <p className="text-charcoal/60">Your account does not have access to this page.</p>
        </div>
      </div>
    )
  }

  return children
}
