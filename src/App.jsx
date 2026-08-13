import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRouter from './pages/RoleRouter'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import StaffPOS from './pages/staff/StaffPOS'
import CustomerHome from './pages/customer/CustomerHome'
import TestHooksDemo from './pages/TestHooksDemo'
import TestComponentsDemo from './pages/TestComponentsDemo'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/" element={<RoleRouter />} />

          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['owner', 'staff']}>
                <StaffPOS />
              </ProtectedRoute>
            }
          />

          <Route
            path="/shop"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerHome />
              </ProtectedRoute>
            }
          />

          {/* Temporary test routes - remove after tasks verified */}
          <Route path="/test-hooks" element={<TestHooksDemo />} />
          <Route path="/test-components" element={<TestComponentsDemo />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
