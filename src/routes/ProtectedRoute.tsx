import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AppShell } from '../components/layout/AppShell'
import { LoadingState } from '../components/states/LoadingState'
import { useAppSelector } from '../hooks/useAppStore'
import type { UserProfile, UserRole } from '../types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, initialized } = useAppSelector((state) => state.auth)
  const { profile, status } = useAppSelector((state) => state.profile)

  if (!initialized) {
    return <LoadingState label="Restoring session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (status === 'loading') {
    return <LoadingState label="Loading profile..." />
  }

  const resolvedProfile: UserProfile =
    profile ||
    ({
      uid: user.uid,
      email: user.email,
      fullName: user.email.split('@')[0] || 'New User',
      department: 'Unassigned',
      role: 'student',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies UserProfile)

  if (allowedRoles && !allowedRoles.includes(resolvedProfile.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AppShell profile={resolvedProfile}>
      <Outlet />
    </AppShell>
  )
}
