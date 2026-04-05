import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import type { AppAuthUser, LoginPayload, RegisterPayload } from '../../types'
import { auth } from '../../lib/firebase'

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

  const response = await signInWithEmailAndPassword(auth, payload.email, payload.password)
  return mapAuthUser(response.user)
}

export async function register(payload: RegisterPayload) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  const response = await createUserWithEmailAndPassword(auth, payload.email, payload.password)
  return mapAuthUser(response.user)
}

export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  const response = await signInWithPopup(auth, provider)
  return mapAuthUser(response.user)
}

export async function logout() {
  if (!auth) {
    throw new Error('Firebase Auth is not configured.')
  }

  await signOut(auth)
}
