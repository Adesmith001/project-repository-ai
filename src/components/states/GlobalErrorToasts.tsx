import { useAppSelector } from '../../hooks/useAppStore'
import { useErrorToast } from '../../hooks/useErrorToast'

export function GlobalErrorToasts() {
  const authError = useAppSelector((state) => state.auth.error)
  const profileError = useAppSelector((state) => state.profile.error)
  const topicCheckerError = useAppSelector((state) => state.topicChecker.error)

  useErrorToast(authError)
  useErrorToast(profileError)
  useErrorToast(topicCheckerError)

  return null
}
