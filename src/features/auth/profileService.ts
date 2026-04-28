import { FirebaseError } from 'firebase/app'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { UserProfile, UserRole } from '../../types'

function removeUndefinedFields<T extends object>(value: T): Partial<T> {
  const result: Partial<T> = {}

  for (const [key, fieldValue] of Object.entries(value) as Array<[keyof T, T[keyof T]]>) {
    if (fieldValue !== undefined) {
      result[key] = fieldValue
    }
  }

  return result
}

function normalizeUserProfile(data: Partial<UserProfile>): UserProfile {
  return {
    uid: data.uid || '',
    email: data.email || '',
    fullName: data.fullName || '',
    photoURL: data.photoURL,
    department: data.department || '',
    role: (data.role || 'student') as UserRole,
    assignedSupervisorUid: data.assignedSupervisorUid || '',
    assignedSupervisorName: data.assignedSupervisorName || '',
    uploadCleared: Boolean(data.uploadCleared),
    clearedBySupervisorUid: data.clearedBySupervisorUid || '',
    clearedBySupervisorName: data.clearedBySupervisorName || '',
    clearanceUpdatedAt: data.clearanceUpdatedAt || '',
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt || '',
  }
}

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

  const writePayload = removeUndefinedFields(profile)

  try {
    await setDoc(doc(db, 'users', profile.uid), writePayload, { merge: true })
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while saving your profile. Deploy the latest firestore.rules to the same Firebase project configured in your app.',
      )
    }

    throw error
  }

  return normalizeUserProfile(writePayload)
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

  return normalizeUserProfile(snapshot.data() as Partial<UserProfile>)
}

export async function listUserProfiles() {
  const snapshot = await getDocs(getUsersCollection())

  return snapshot.docs.map((item) => normalizeUserProfile(item.data() as Partial<UserProfile>))
}

export async function listSupervisorProfiles() {
  const users = await listUserProfiles()
  return users.filter((item) => item.role === 'supervisor')
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

  try {
    await updateDoc(doc(db, 'users', payload.userId), {
      uploadCleared: payload.cleared,
      clearedBySupervisorUid: payload.cleared ? payload.actorUid : '',
      clearedBySupervisorName: payload.cleared ? payload.actorName : '',
      clearanceUpdatedAt: now,
      updatedAt: now,
    })
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while updating student clearance. Ensure the student is assigned to you and deploy the latest firestore.rules to the same Firebase project.',
      )
    }

    throw error
  }
}

export async function setStudentSupervisorAssignment(payload: {
  userId: string
  supervisorUid: string
  supervisorName: string
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  await updateDoc(doc(db, 'users', payload.userId), {
    assignedSupervisorUid: payload.supervisorUid,
    assignedSupervisorName: payload.supervisorName,
    updatedAt: now,
  })
}

export async function setUserRole(payload: {
  userId: string
  role: UserRole
  actorUid: string
  actorName: string
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  await updateDoc(doc(db, 'users', payload.userId), {
    role: payload.role,
    uploadCleared: payload.role === 'student' ? false : true,
    clearedBySupervisorUid: payload.role === 'student' ? '' : payload.actorUid,
    clearedBySupervisorName: payload.role === 'student' ? '' : payload.actorName,
    clearanceUpdatedAt: now,
    updatedAt: now,
  })
}
