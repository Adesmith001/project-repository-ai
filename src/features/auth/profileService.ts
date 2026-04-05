import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { UserProfile } from '../../types'

function getUsersCollection() {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  return collection(db, 'users')
}

export async function saveUserProfile(profile: UserProfile) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  await setDoc(doc(db, 'users', profile.uid), profile, { merge: true })

  return profile
}

export async function getUserProfile(uid: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const snapshot = await getDoc(doc(db, 'users', uid))

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export async function listUserProfiles() {
  const snapshot = await getDocs(getUsersCollection())

  return snapshot.docs.map((item) => item.data() as UserProfile)
}
