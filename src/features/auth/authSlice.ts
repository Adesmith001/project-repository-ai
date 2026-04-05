import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { AppAuthUser, LoginPayload, RegisterPayload } from '../../types'
import * as authService from './authService'

interface AuthState {
  user: AppAuthUser | null
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'
  error: string | null
  initialized: boolean
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
  initialized: false,
}

export const loginThunk = createAsyncThunk('auth/login', async (payload: LoginPayload) => {
  return authService.login(payload)
})

export const registerThunk = createAsyncThunk('auth/register', async (payload: RegisterPayload) => {
  return authService.register(payload)
})

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authService.logout()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: { payload: AppAuthUser | null }) => {
      state.user = action.payload
      state.status = action.payload ? 'authenticated' : 'unauthenticated'
      state.initialized = true
    },
    setAuthError: (state, action: { payload: string | null }) => {
      state.error = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.error = action.error.message || 'Unable to login.'
        state.status = 'unauthenticated'
      })
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.user = action.payload
        state.status = 'authenticated'
        state.initialized = true
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.error = action.error.message || 'Unable to register.'
        state.status = 'unauthenticated'
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.status = 'unauthenticated'
        state.initialized = true
      })
  },
})

export const { setAuthUser, setAuthError } = authSlice.actions
export default authSlice.reducer
