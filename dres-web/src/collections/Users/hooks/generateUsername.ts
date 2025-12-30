import type { FieldHook } from 'payload'

export const generateUsername: FieldHook = async ({ data, req, operation, value }) => {
  // If username already exists and we're updating, keep it
  if (value && operation === 'update') {
    return value
  }

  // Only generate username on create or if it's not set
  if ((operation === 'create' || !value) && (data?.shopName || data?.firstName)) {
    const { payload } = req
    
    // Use shopName if available, otherwise use firstName
    const baseName = data?.shopName || data?.firstName || 'user'
    
    // Convert to lowercase and replace spaces with dots
    const username = baseName.toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') // Remove special chars except dots
    
    // Check if username exists and add number suffix if needed
    let finalUsername = username
    let counter = 1
    
    // Limit checks to prevent infinite loop
    const maxAttempts = 100
    let attempts = 0
    
    while (attempts < maxAttempts) {
      try {
        const existing = await payload.find({
          collection: 'users',
          where: {
            username: {
              equals: finalUsername,
            },
          },
          limit: 1,
        })
        
        if (existing.docs.length === 0) {
          break
        }
        
        finalUsername = `${username}${counter}`
        counter++
        attempts++
      } catch (error) {
        // If error, just use the current username
        break
      }
    }
    
    return finalUsername
  }
  
  return value
}
