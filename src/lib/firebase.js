import { initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const env = import.meta.env

/** False until the VITE_FIREBASE_* variables are filled in (see .env.example). */
export const firebaseConfigured = Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID)

// getAuth throws on a missing API key, so nothing is initialized until the app is configured.
const app = firebaseConfigured
  ? initializeApp({
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    })
  : null

export const auth = app && getAuth(app)
if (auth) auth.languageCode = 'vi'

// Element props can hold optional fields that are undefined; Firestore would reject those otherwise.
export const db = app && initializeFirestore(app, { ignoreUndefinedProperties: true })
export const storage = app && getStorage(app)

export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
