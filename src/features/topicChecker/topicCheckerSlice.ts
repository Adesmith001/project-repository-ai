import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import type { TopicCheckInput, TopicCheckResult } from '../../types'
import { runTopicCheck } from './topicCheckerService'

interface TopicCheckerState {
  latestInput: TopicCheckInput | null
  result: TopicCheckResult | null
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
}

const initialState: TopicCheckerState = {
  latestInput: null,
  result: null,
  status: 'idle',
  error: null,
}

export const runTopicCheckThunk = createAsyncThunk(
  'topicChecker/run',
  async (input: TopicCheckInput) => {
    return runTopicCheck(input)
  },
)

const topicCheckerSlice = createSlice({
  name: 'topicChecker',
  initialState,
  reducers: {
    clearTopicCheckResult: (state) => {
      state.result = null
      state.error = null
      state.status = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runTopicCheckThunk.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.latestInput = action.meta.arg
      })
      .addCase(runTopicCheckThunk.fulfilled, (state, action: { payload: TopicCheckResult }) => {
        state.result = action.payload
        state.status = 'ready'
      })
      .addCase(runTopicCheckThunk.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message || 'Unable to run topic check.'
      })
  },
})

export const { clearTopicCheckResult } = topicCheckerSlice.actions
export default topicCheckerSlice.reducer
