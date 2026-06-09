import { useEffect } from 'react'
import { setAuthUser } from '../features/auth/authSlice'
import { clearProfile, fetchProfileThunk } from '../features/auth/profileSlice'
import { syncOwnProfileEmailFromAuth } from '../features/auth/profileService'
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

      void (async () => {
        const profile = await dispatch(fetchProfileThunk(user.uid)).unwrap().catch(() => null)

        if (!profile || !user.email || profile.email === user.email) {
          return
        }

        await syncOwnProfileEmailFromAuth({
          uid: user.uid,
          email: user.email,
        }).catch(() => null)

        await dispatch(fetchProfileThunk(user.uid)).unwrap().catch(() => null)
      })()
    })

    return () => {
      unsubscribe()
    }
  }, [dispatch])
}
