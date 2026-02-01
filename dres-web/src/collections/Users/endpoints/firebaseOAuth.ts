import type { PayloadHandler } from 'payload'
import type { User } from '@/payload-types'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

interface FirebaseTokenPayload {
  iss: string
  aud: string
  auth_time: number
  user_id: string
  sub: string
  iat: number
  exp: number
  email?: string
  email_verified?: boolean
  name?: string
  picture?: string
  firebase: {
    identities: Record<string, string[]>
    sign_in_provider: string
  }
}

// Generate a secure random password
function generateSecurePassword(): string {
  return crypto.randomBytes(32).toString('base64') + 'Aa1!'
}

export const firebaseOAuth: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    const body = req.json ? await req.json() : {}
    const { idToken, provider, email, firstName, lastName, photoUrl, firebaseUid } = body

    console.log('Firebase OAuth request received:', { provider, email, firstName, lastName })

    if (!idToken) {
      return Response.json(
        { error: 'ID token is required' },
        { status: 400 }
      )
    }

    let verifiedEmail = email
    let verifiedUid = firebaseUid
    let verifiedFirstName = firstName
    let verifiedLastName = lastName

    // Decode the Firebase ID token (without verification for now)
    // In production, you should verify with Firebase Admin SDK
    try {
      const decoded = jwt.decode(idToken) as FirebaseTokenPayload | null
      
      if (decoded) {
        console.log('Decoded Firebase token:', {
          email: decoded.email,
          name: decoded.name,
          uid: decoded.sub,
          provider: decoded.firebase?.sign_in_provider
        })
        
        verifiedEmail = decoded.email || email
        verifiedUid = decoded.sub || firebaseUid
        
        // Extract name from token if available
        if (decoded.name) {
          const nameParts = decoded.name.trim().split(' ')
          if (!firstName && nameParts.length > 0) {
            verifiedFirstName = nameParts[0]
          }
          if (!lastName && nameParts.length > 1) {
            verifiedLastName = nameParts.slice(1).join(' ')
          }
        }
      }
    } catch (decodeError) {
      console.warn('Failed to decode Firebase token:', decodeError)
      // Continue with provided email
    }

    if (!verifiedEmail) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    console.log('Looking up user with email:', verifiedEmail)

    // Generate a new random password for this login session
    const newPassword = generateSecurePassword()

    // Check if user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: { equals: verifiedEmail },
      },
      limit: 1,
    })

    let user: User | null = null

    if (existingUsers.docs.length > 0) {
      // User exists - update password and OAuth info
      user = existingUsers.docs[0]
      console.log('Found existing user:', user.id)
      
      // Update password and OAuth provider info
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          password: newPassword,
          oauthProvider: provider || user.oauthProvider,
          oauthId: verifiedUid || user.oauthId,
        } as Partial<User>,
      })
    } else {
      // Create new user with the random password
      console.log('Creating new user with email:', verifiedEmail)

      // Use verified names from token
      const userFirstName = verifiedFirstName || (provider === 'google' ? 'Google' : 'Apple')
      const userLastName = verifiedLastName || 'User'

      user = await payload.create({
        collection: 'users',
        disableVerificationEmail: true, // Don't send verification email for OAuth users
        data: {
          email: verifiedEmail,
          password: newPassword,
          firstName: userFirstName,
          lastName: userLastName,
          oauthProvider: provider as 'apple' | 'google',
          oauthId: verifiedUid || null,
          role: 'user',
          accountStatus: 'active',
        },
      })
      
      console.log('Created new user:', user.id)
    }

    // Now login with Payload's native login to get a proper session token
    console.log('Logging in user with Payload native login...')
    
    const loginResult = await payload.login({
      collection: 'users',
      data: {
        email: verifiedEmail,
        password: newPassword,
      },
    })

    console.log('OAuth login successful for:', user.email)

    return Response.json({
      message: 'Login successful',
      token: loginResult.token,
      exp: loginResult.exp,
      user: {
        id: loginResult.user.id,
        email: loginResult.user.email,
        firstName: loginResult.user.firstName,
        lastName: loginResult.user.lastName,
        shopName: loginResult.user.shopName,
        photo: loginResult.user.photo,
      },
    })
  } catch (error) {
    console.error('Firebase OAuth error:', error)
    return Response.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
