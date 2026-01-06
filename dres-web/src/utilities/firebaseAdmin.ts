import admin from 'firebase-admin'
import path from 'path'
import fs from 'fs'

// Initialize Firebase Admin SDK - called on every getMessaging() to ensure it's ready
function ensureFirebaseInitialized(): void {
  // If already initialized with credentials, skip
  if (admin.apps.length > 0) {
    const app = admin.apps[0]
    if (app?.options?.credential) {
      return
    }
    // Delete the unconfigured app and reinitialize
    app?.delete()
  }

  // Option 1: Try loading from JSON file directly (most reliable for local dev)
  const serviceAccountPath = path.resolve(
    process.cwd(),
    '..',
    'dres-4f135-firebase-adminsdk-fbsvc-c830ea3a3f.json',
  )

  if (fs.existsSync(serviceAccountPath)) {
    try {
      const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      })
      return
    } catch (error) {
      console.error('Failed to load Firebase service account from file:', error)
    }
  }

  // Option 2: Check for service account credentials in environment variable
  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (serviceAccount) {
    try {
      // Remove surrounding quotes if present (from .env file)
      serviceAccount = serviceAccount.trim()
      if (
        (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) ||
        (serviceAccount.startsWith('"') && serviceAccount.endsWith('"'))
      ) {
        serviceAccount = serviceAccount.slice(1, -1)
      }

      const credentials = JSON.parse(serviceAccount)
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      })
      return
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error)
    }
  }

  // Option 3: Fallback to GOOGLE_APPLICATION_CREDENTIALS file path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
    return
  }

  console.warn('Firebase Admin not configured. Push notifications will not work.')
}

// Get messaging instance - ensures Firebase is initialized first
export function getMessaging(): admin.messaging.Messaging {
  ensureFirebaseInitialized()
  return admin.messaging()
}
