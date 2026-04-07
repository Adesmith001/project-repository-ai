import { FirebaseError } from 'firebase/app'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
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

  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true })
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while saving your profile. Deploy the latest firestore.rules to the same Firebase project configured in your app.',
      )
    }

    throw error
  }

  return profile
}

export async function getUserProfile(uid: string) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  let snapshot

  try {
    snapshot = await getDoc(doc(db, 'users', uid))
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while reading your profile. Deploy the latest firestore.rules to the same Firebase project configured in your app.',
      )
    }

    throw error
  }

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as UserProfile
}

export async function listUserProfiles() {
  const snapshot = await getDocs(getUsersCollection())

  return snapshot.docs.map((item) => item.data() as UserProfile)
}

export async function setStudentUploadClearance(payload: {
  userId: string
  cleared: boolean
  actorUid: string
  actorName: string
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  await updateDoc(doc(db, 'users', payload.userId), {
    uploadCleared: payload.cleared,
    clearedBySupervisorUid: payload.cleared ? payload.actorUid : '',
    clearedBySupervisorName: payload.cleared ? payload.actorName : '',
    clearanceUpdatedAt: now,
    updatedAt: now,
  })
}
