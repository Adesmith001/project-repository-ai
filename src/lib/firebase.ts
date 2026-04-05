import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { appEnv, isFirebaseConfigured } from './env'

const firebaseConfig = {
  apiKey: appEnv.firebaseApiKey,
  authDomain: appEnv.firebaseAuthDomain,
  projectId: appEnv.firebaseProjectId,
  storageBucket: appEnv.firebaseStorageBucket,
  messagingSenderId: appEnv.firebaseMessagingSenderId,
  appId: appEnv.firebaseAppId,
}

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const auth = firebaseApp ? getAuth(firebaseApp) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
