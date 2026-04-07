import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoadingState } from '../components/states/LoadingState'
import { useAuthBootstrap } from '../hooks/useAuthBootstrap'
import { useAppSelector } from '../hooks/useAppStore'
import { AdminUsersPage } from '../pages/AdminUsersPage'
import { CheckTopicPage } from '../pages/CheckTopicPage'
import { DashboardPage } from '../pages/DashboardPage'
import { LandingPage } from '../pages/LandingPage'
import { LoginPage } from '../pages/LoginPage'
import { CompleteProfilePage } from '../pages/CompleteProfilePage'
import { ProjectDetailPage } from '../pages/ProjectDetailPage'
import { ProjectsPage } from '../pages/ProjectsPage'
import { RegisterPage } from '../pages/RegisterPage'
import { SettingsProfilePage } from '../pages/SettingsProfilePage'
import { UploadProjectPage } from '../pages/UploadProjectPage'
import { ProtectedRoute } from './ProtectedRoute'

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, initialized } = useAppSelector((state) => state.auth)

  if (!initialized) {
    return <LoadingState fullScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function HomeRoute() {
  return <LandingPage />
}

function AuthOnlyRoute({ children }: { children: ReactNode }) {
  const { user, initialized } = useAppSelector((state) => state.auth)

  if (!initialized) {
    return <LoadingState fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export function AppRouter() {
  useAuthBootstrap()

  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/complete-profile"
        element={
          <AuthOnlyRoute>
            <CompleteProfilePage />
          </AuthOnlyRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/settings" element={<SettingsProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student', 'supervisor', 'admin']} />}>
        <Route path="/check-topic" element={<CheckTopicPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['student', 'supervisor', 'admin']} />}>
        <Route path="/upload-project" element={<UploadProjectPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin', 'supervisor']} />}>
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
