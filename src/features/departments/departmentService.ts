import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { DEFAULT_DEPARTMENT } from '../../lib/constants'

interface DepartmentRecord {
  name: string
  createdAt: string
  updatedAt: string
  createdByUid: string
}

function getDepartmentsCollection() {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  return collection(db, 'departments')
}

function normalizeDepartmentName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
}

function departmentDocId(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'department'
}

export async function listDepartments() {
  const snapshot = await getDocs(getDepartmentsCollection())

  const names = snapshot.docs
    .map((item) => {
      const data = item.data() as Partial<DepartmentRecord>
      return typeof data.name === 'string' ? normalizeDepartmentName(data.name) : ''
    })
    .filter((item) => item.length > 0)

  const unique = Array.from(new Set([DEFAULT_DEPARTMENT, ...names]))

  return unique.sort((a, b) => a.localeCompare(b))
}

export async function createDepartment(payload: { name: string; actorUid: string }) {
  if (!db) {
    throw new Error('Firestore is not configured.')
  }

  const normalizedName = normalizeDepartmentName(payload.name)

  if (normalizedName.length < 2 || normalizedName.length > 120) {
    throw new Error('Department name must be between 2 and 120 characters.')
  }

  const allDepartments = await listDepartments()

  if (allDepartments.some((item) => item.toLowerCase() === normalizedName.toLowerCase())) {
    throw new Error('Department already exists.')
  }

  const id = departmentDocId(normalizedName)
  const targetRef = doc(db, 'departments', id)
  const existing = await getDoc(targetRef)

  if (existing.exists()) {
    throw new Error('Department already exists.')
  }

  const now = new Date().toISOString()

  const record: DepartmentRecord = {
    name: normalizedName,
    createdAt: now,
    updatedAt: now,
    createdByUid: payload.actorUid,
  }

  await setDoc(targetRef, record)

  return record
}
