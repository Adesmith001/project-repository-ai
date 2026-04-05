import { createSlice } from '@reduxjs/toolkit'
import { DEFAULT_PROJECT_FILTERS } from '../../lib/constants'
import type { ProjectFilters } from '../../types'

interface ProjectFilterState {
  filters: ProjectFilters
}

const initialState: ProjectFilterState = {
  filters: DEFAULT_PROJECT_FILTERS,
}

const projectFilterSlice = createSlice({
  name: 'projectFilters',
  initialState,
  reducers: {
    setProjectFilter: (
      state,
      action: {
        payload: {
          key: keyof ProjectFilters
          value: string
        }
      },
    ) => {
      state.filters[action.payload.key] = action.payload.value
    },
    resetProjectFilters: (state) => {
      state.filters = DEFAULT_PROJECT_FILTERS
    },
  },
})

export const { setProjectFilter, resetProjectFilters } = projectFilterSlice.actions
export default projectFilterSlice.reducer
