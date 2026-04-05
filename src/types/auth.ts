export type UserRole = 'student' | 'supervisor' | 'admin'

export interface AppAuthUser {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
}

export interface UserProfile {
  uid: string
  email: string
  fullName: string
  photoURL?: string
  department: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  department: string
  role: Exclude<UserRole, 'admin'>
}

export interface LoginPayload {
  email: string
  password: string
}
