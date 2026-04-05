import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import profileReducer from '../features/auth/profileSlice'
import projectFilterReducer from '../features/projects/projectFilterSlice'
import topicCheckerReducer from '../features/topicChecker/topicCheckerSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    projectFilters: projectFilterReducer,
    topicChecker: topicCheckerReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
