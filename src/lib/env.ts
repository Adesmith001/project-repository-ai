const env = import.meta.env

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim().length > 0)
}

export const appEnv = {
  firebaseApiKey: env.VITE_FIREBASE_API_KEY,
  firebaseAuthDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: env.VITE_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: env.VITE_FIREBASE_APP_ID,
  cloudinaryCloudName: env.VITE_CLOUDINARY_CLOUD_NAME,
  cloudinaryUploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET,
}

export const isFirebaseConfigured =
  hasValue(appEnv.firebaseApiKey) &&
  hasValue(appEnv.firebaseAuthDomain) &&
  hasValue(appEnv.firebaseProjectId) &&
  hasValue(appEnv.firebaseStorageBucket) &&
  hasValue(appEnv.firebaseMessagingSenderId) &&
  hasValue(appEnv.firebaseAppId)

export const isCloudinaryConfigured =
  hasValue(appEnv.cloudinaryCloudName) && hasValue(appEnv.cloudinaryUploadPreset)
