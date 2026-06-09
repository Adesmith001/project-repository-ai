type FirebaseLikeError = {
  code?: string
  message?: string
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password. Check your details and try again.',
  'auth/user-not-found': 'Incorrect email or password. Check your details and try again.',
  'auth/wrong-password': 'Incorrect email or password. Check your details and try again.',
  'auth/too-many-requests': 'Too many sign-in attempts. Wait a moment and try again.',
  'auth/requires-recent-login': 'For security, sign in again before changing your institutional email.',
  'auth/invalid-email': 'Enter a valid email address and try again.',
}

export function toUserFacingAuthError(
  error: FirebaseLikeError,
  fallback = 'Unable to complete the authentication request.',
) {
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code]
  }

  return error.message?.trim() || fallback
}
