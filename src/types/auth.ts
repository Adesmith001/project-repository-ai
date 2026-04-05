export type UserRole = 'student' | 'supervisor' | 'admin'

export interface AppAuthUser {
  uid: string
  email: string
}

export interface UserProfile {
  uid: string
  email: string
  fullName: string
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
  role: Exclude<UserRole, 'admin'> | 'admin'
}

export interface LoginPayload {
  email: string
  password: string
}
