import { describe, expect, it } from 'vitest'
import { toUserFacingAuthError } from '../authError'

describe('toUserFacingAuthError', () => {
  it('maps invalid credentials to a password-first login message', () => {
    expect(toUserFacingAuthError({ code: 'auth/invalid-credential' })).toBe(
      'Incorrect email or password. Check your details and try again.',
    )
  })

  it('maps recent-login requirement to a reauthentication message', () => {
    expect(toUserFacingAuthError({ code: 'auth/requires-recent-login' })).toBe(
      'For security, sign in again before changing your institutional email.',
    )
  })
})
