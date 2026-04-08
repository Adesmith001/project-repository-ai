import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LoadingState } from '../components/states/LoadingState'
import { useAppSelector } from '../hooks/useAppStore'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, initialized } = useAppSelector((state) => state.auth)
  const { profile, status } = useAppSelector((state) => state.profile)

  if (!initialized) {
    return <LoadingState fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (status === 'idle' || status === 'loading') {
    return <LoadingState fullScreen />
  }

  if (!profile) {
    return <Navigate to="/complete-profile" replace />
  }

  if (profile.role === 'student' && !profile.assignedSupervisorUid.trim()) {
    return <Navigate to="/complete-profile" replace />
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AppShell profile={profile}>
      <Outlet />
    </AppShell>
  )
}
