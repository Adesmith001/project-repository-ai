import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RegisterPayload, UserProfile } from '../../types'
import { DEPARTMENTS } from '../../lib/constants'
import { getUserProfile, saveUserProfile } from './profileService'

interface ProfileState {
  profile: UserProfile | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

const initialState: ProfileState = {
  profile: null,
  status: 'idle',
  error: null,
}

export const fetchProfileThunk = createAsyncThunk('profile/fetch', async (uid: string) => {
  return getUserProfile(uid)
})

export const ensureProfileFromRegisterThunk = createAsyncThunk(
  'profile/ensureRegister',
  async (payload: { uid: string; values: RegisterPayload }) => {
    const now = new Date().toISOString()
    const isStudent = payload.values.role === 'student'

    if (isStudent && (!payload.values.assignedSupervisorUid || !payload.values.assignedSupervisorName)) {
      throw new Error('Students must select a supervisor during onboarding.')
    }

    const profile: UserProfile = {
      uid: payload.uid,
      email: payload.values.email,
      fullName: payload.values.fullName,
      photoURL: undefined,
      department: payload.values.department,
      role: payload.values.role,
      assignedSupervisorUid: isStudent ? payload.values.assignedSupervisorUid || '' : '',
      assignedSupervisorName: isStudent ? payload.values.assignedSupervisorName || '' : '',
      uploadCleared: payload.values.role !== 'student',
      clearedBySupervisorUid: '',
      clearedBySupervisorName: '',
      clearanceUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    return saveUserProfile(profile)
  },
)

export const ensureProfileForAuthUserThunk = createAsyncThunk(
  'profile/ensureAuthUser',
  async (payload: {
    uid: string
    email: string
    displayName?: string
    photoURL?: string
    fullName?: string
    department?: string
    role?: RegisterPayload['role']
    assignedSupervisorUid?: string
    assignedSupervisorName?: string
  }) => {
    const existing = await getUserProfile(payload.uid)

    if (existing) {
      return existing
    }

    if (!payload.department || !payload.role) {
      throw new Error('Complete your profile by selecting a department and role.')
    }

    if (
      payload.role === 'student'
      && (!payload.assignedSupervisorUid?.trim() || !payload.assignedSupervisorName?.trim())
    ) {
      throw new Error('Students must select a supervisor before continuing.')
    }

    const now = new Date().toISOString()
    const derivedName =
      payload.fullName?.trim() ||
      payload.displayName?.trim() ||
      payload.email.split('@')[0] ||
      'Student User'

    const profile: UserProfile = {
      uid: payload.uid,
      email: payload.email,
      fullName: derivedName,
      photoURL: payload.photoURL,
      department: payload.department || DEPARTMENTS[0],
      role: payload.role || 'student',
      assignedSupervisorUid: (payload.role || 'student') === 'student' ? payload.assignedSupervisorUid || '' : '',
      assignedSupervisorName: (payload.role || 'student') === 'student' ? payload.assignedSupervisorName || '' : '',
      uploadCleared: (payload.role || 'student') !== 'student',
      clearedBySupervisorUid: '',
      clearedBySupervisorName: '',
      clearanceUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    return saveUserProfile(profile)
  },
)

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.profile = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchProfileThunk.fulfilled, (state, action) => {
        state.profile = action.payload
        state.status = 'ready'
        state.error = null
      })
      .addCase(fetchProfileThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message || 'Unable to load profile.'
      })
      .addCase(ensureProfileFromRegisterThunk.fulfilled, (state, action) => {
        state.profile = action.payload
        state.status = 'ready'
        state.error = null
      })
      .addCase(ensureProfileForAuthUserThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(ensureProfileForAuthUserThunk.fulfilled, (state, action) => {
        state.profile = action.payload
        state.status = 'ready'
        state.error = null
      })
      .addCase(ensureProfileForAuthUserThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message || 'Unable to prepare user profile.'
      })
  },
})

export const { clearProfile } = profileSlice.actions
export default profileSlice.reducer
