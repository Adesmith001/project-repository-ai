import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import type { AppAuthUser, LoginPayload, RegisterPayload } from '../../types'
import { auth } from '../../lib/firebase'
import { toUserFacingAuthError } from './authError'

function mapAuthUser(payload: {
  uid: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
}) {
  if (!payload.email) {
    throw new Error('User email is missing.')
  }

  return {
    uid: payload.uid,
    email: payload.email,
    displayName: payload.displayName ?? undefined,
    photoURL: payload.photoURL ?? undefined,
  } satisfies AppAuthUser
}

export function subscribeAuthChanges(callback: (user: AppAuthUser | null) => void) {
  if (!auth) {
    callback(null)
    return () => undefined
  }

  return onAuthStateChanged(auth, (firebaseUser) => {
    if (!firebaseUser?.email) {
      callback(null)
      return
    }

    callback(mapAuthUser(firebaseUser))
  })
}

export async function login(payload: LoginPayload) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  try {
    const response = await signInWithEmailAndPassword(auth, payload.email, payload.password)
    return mapAuthUser(response.user)
  } catch (error) {
    throw new Error(toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to login.'))
  }
}

export async function register(payload: RegisterPayload) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  try {
    const response = await createUserWithEmailAndPassword(auth, payload.email, payload.password)

    const trimmedName = payload.fullName.trim()

    if (trimmedName.length > 0) {
      await updateProfile(response.user, { displayName: trimmedName })
    }

    return mapAuthUser(response.user)
  } catch (error) {
    throw new Error(toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to register.'))
  }
}

export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    const response = await signInWithPopup(auth, provider)
    return mapAuthUser(response.user)
  } catch (error) {
    throw new Error(
      toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to sign in with Google.'),
    )
  }
}

export async function logout() {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  await signOut(auth)
}

export async function requestPasswordReset(email: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error) {
    throw new Error(toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to send reset email.'))
  }
}

export async function requestSupervisorEmailChange(nextEmail: string) {
  if (!auth?.currentUser) {
    throw new Error('Sign in again before updating your institutional email.')
  }

  try {
    await verifyBeforeUpdateEmail(auth.currentUser, nextEmail)
  } catch (error) {
    throw new Error(
      toUserFacingAuthError(error as { code?: string; message?: string }, 'Unable to start institutional email update.'),
    )
  }
}
