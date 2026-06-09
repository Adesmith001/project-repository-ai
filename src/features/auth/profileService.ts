import { FirebaseError } from 'firebase/app'
import { collection, deleteField, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'
import { canUseSupervisorMode } from '../../lib/authz'
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
    // Treat null the same as missing — the Firestore rule requires photoURL to be
    // a string when present, and null is not a string.
    photoURL: data.photoURL ?? undefined,
    department: data.department || '',
    role: (data.role || 'student') as UserRole,
    staffId: data.staffId,
    supervisorOverride: Boolean(data.supervisorOverride),
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
  return users.filter((item) => canUseSupervisorMode(item))
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

export async function updateOwnSupervisorProfile(payload: {
  uid: string
  fullName: string
  department: string
  staffId: string
  photoURL?: string | null
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  // Only send the fields the Firestore rule allows for supervisor identity
  // repair: fullName, department, staffId, updatedAt, and optionally photoURL.
  // Including photoURL unconditionally causes changedKeys() to include it which
  // fails the hasOnly() check in canOwnerRepairSupervisorIdentity.
  const updatePayload: Record<string, unknown> = {
    fullName: payload.fullName.trim(),
    department: payload.department.trim(),
    staffId: payload.staffId.trim(),
    updatedAt: now,
  }

  // If photoURL is explicitly null (Firestore null) it breaks
  // isValidUserProfileShape (the rule requires it to be a string or absent).
  // Use deleteField() to remove the null entry so the rule sees it as absent.
  // Only include photoURL in the payload when we actually need to change it.
  if (payload.photoURL === null) {
    updatePayload.photoURL = deleteField()
  } else if (payload.photoURL) {
    updatePayload.photoURL = payload.photoURL
  }
  // If photoURL is undefined, omit it entirely — no change needed.

  try {
    await updateDoc(doc(db, 'users', payload.uid), updatePayload)
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Permission denied while updating your supervisor profile. Ensure your CU staff ID is at least 2 characters and your account is signed in correctly.',
      )
    }

    throw error
  }

}

export async function syncOwnProfileEmailFromAuth(payload: {
  uid: string
  email: string
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  try {
    await updateDoc(doc(db, 'users', payload.uid), {
      email: payload.email.trim().toLowerCase(),
      updatedAt: now,
    })
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while syncing your institutional email. Deploy the latest firestore.rules to the same Firebase project.',
      )
    }

    throw error
  }
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

  if (payload.role === 'supervisor') {
    const existing = await getUserProfile(payload.userId)

    if (!existing) {
      throw new Error('The selected user profile no longer exists.')
    }

    if (!canUseSupervisorMode({ role: 'supervisor', email: existing.email, staffId: existing.staffId })) {
      throw new Error('Only Covenant University staff accounts with a CU staff ID can be promoted to supervisor.')
    }
  }

  const writePayload = removeUndefinedFields({
    role: payload.role,
    assignedSupervisorUid: payload.role === 'student' ? undefined : '',
    assignedSupervisorName: payload.role === 'student' ? undefined : '',
    uploadCleared: payload.role === 'student' ? false : true,
    clearedBySupervisorUid: payload.role === 'student' ? '' : payload.actorUid,
    clearedBySupervisorName: payload.role === 'student' ? '' : payload.actorName,
    clearanceUpdatedAt: now,
    updatedAt: now,
  })

  try {
    await updateDoc(doc(db, 'users', payload.userId), writePayload)
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while updating user role. Promote users to admin or supervisor from this page, and use the profile flow to create student accounts with supervisor assignment.',
      )
    }

    throw error
  }
}

export async function setSupervisorOverride(payload: {
  userId: string
  override: boolean
}) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const now = new Date().toISOString()

  try {
    await updateDoc(doc(db, 'users', payload.userId), {
      supervisorOverride: payload.override,
      updatedAt: now,
    })
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      throw new Error(
        'Missing or insufficient permissions while updating supervisor override. Deploy the latest firestore.rules to the same Firebase project.',
      )
    }

    throw error
  }
}
