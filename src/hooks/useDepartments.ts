import { useCallback, useEffect, useState } from 'react'
import { listDepartments } from '../features/departments/departmentService'
import { DEFAULT_DEPARTMENT } from '../lib/constants'

export function useDepartments() {
  const [departments, setDepartments] = useState<string[]>([DEFAULT_DEPARTMENT])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [departmentError, setDepartmentError] = useState('')

  const refreshDepartments = useCallback(async () => {
    try {
      setLoadingDepartments(true)
      const values = await listDepartments()
      setDepartments(values.length > 0 ? values : [DEFAULT_DEPARTMENT])
      setDepartmentError('')
    } catch (error) {
      setDepartments([DEFAULT_DEPARTMENT])
      setDepartmentError(error instanceof Error ? error.message : 'Unable to load departments.')
    } finally {
      setLoadingDepartments(false)
    }
  }, [])

  useEffect(() => {
    void refreshDepartments()
  }, [refreshDepartments])

  return {
    departments,
    loadingDepartments,
    departmentError,
    refreshDepartments,
  }
}
