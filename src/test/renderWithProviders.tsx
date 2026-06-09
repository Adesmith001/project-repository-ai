import { configureStore } from '@reduxjs/toolkit'
import { render } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import authReducer from '../features/auth/authSlice'
import profileReducer from '../features/auth/profileSlice'
import projectFilterReducer from '../features/projects/projectFilterSlice'
import topicCheckerReducer from '../features/topicChecker/topicCheckerSlice'

export function renderWithProviders(ui: ReactElement) {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      profile: profileReducer,
      projectFilters: projectFilterReducer,
      topicChecker: topicCheckerReducer,
    },
  })

  function Wrapper({ children }: PropsWithChildren) {
    return <Provider store={store}>{children}</Provider>
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper }),
  }
}
