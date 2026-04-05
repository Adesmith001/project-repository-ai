import { useEffect } from 'react'
import { setAuthUser } from '../features/auth/authSlice'
import { clearProfile, ensureProfileForAuthUserThunk } from '../features/auth/profileSlice'
import { subscribeAuthChanges } from '../features/auth/authService'
import { useAppDispatch } from './useAppStore'

export function useAuthBootstrap() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const unsubscribe = subscribeAuthChanges((user) => {
      dispatch(setAuthUser(user))

      if (!user) {
        dispatch(clearProfile())
        return
      }

      void dispatch(
        ensureProfileForAuthUserThunk({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      )
    })

    return () => {
      unsubscribe()
    }
  }, [dispatch])
}
