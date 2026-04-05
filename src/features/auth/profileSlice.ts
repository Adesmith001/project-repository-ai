import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { RegisterPayload, UserProfile } from '../../types'
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

    const profile: UserProfile = {
      uid: payload.uid,
      email: payload.values.email,
      fullName: payload.values.fullName,
      department: payload.values.department,
      role: payload.values.role,
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
  },
})

export const { clearProfile } = profileSlice.actions
export default profileSlice.reducer
