import type { PayloadHandler } from 'payload'

/**
 * POST /api/users/update-email
 * Update user's email address with validation and verification
 * 
 * Body: { email: string }
 * 
 * Flow:
 * 1. Validate email format
 * 2. Check if email is already taken by another user
 * 3. Update user's email
 * 4. Set _verified to false
 * 5. Send verification email
 */
export const updateEmail: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json?.() as { email?: string } | undefined

    if (!body?.email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const newEmail = body.email.toLowerCase().trim()

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is the same as current
    if (newEmail === user.email) {
      return Response.json(
        { error: 'New email is the same as current email' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        email: { equals: newEmail },
        id: { not_equals: user.id },
      },
      limit: 1,
    })

    if (existingUser.docs.length > 0) {
      return Response.json(
        { error: 'This email is already registered to another account' },
        { status: 409 }
      )
    }

    // Update user's email and set verified to false
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        email: newEmail,
        _verified: false,
      },
    })

    // Send verification email using Payload's built-in method
    // Payload automatically handles verification token generation and email sending
    try {
      await payload.sendEmail({
        to: newEmail,
        subject: 'Verify your new email address - DRES',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your New Email Address</h2>
            <p>Hi ${updatedUser.firstName || 'there'},</p>
            <p>You recently changed your email address on DRES. Please click the link below to verify your new email:</p>
            <p style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/verify?token=${(updatedUser as any)._verificationToken}&collection=users" 
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 0;">
                Verify Email
              </a>
            </p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br/>The DRES Team</p>
          </div>
        `,
      })

      payload.logger.info(`📧 Verification email sent to ${newEmail} for user ${user.id}`)
    } catch (emailError) {
      payload.logger.error(`Failed to send verification email: ${emailError}`)
      // Don't fail the request if email fails - user can request resend
    }

    return Response.json({
      success: true,
      message: 'Email updated successfully. Please check your inbox for a verification link.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        _verified: updatedUser._verified,
      },
    })
  } catch (error: unknown) {
    payload.logger.error(`Error updating email: ${error}`)
    return Response.json(
      {
        error: 'Failed to update email',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/resend-verification
 * Resend verification email to current user
 */
export const resendVerification: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Check if user is already verified
    if (user._verified) {
      return Response.json(
        { error: 'Email is already verified' },
        { status: 400 }
      )
    }

    // Generate new verification token by updating with same email
    // This triggers Payload's verification flow
    const updatedUser = await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        _verified: false,
      },
    })

    // Send verification email
    try {
      await payload.sendEmail({
        to: user.email,
        subject: 'Verify your email address - DRES',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Hi ${user.firstName || 'there'},</p>
            <p>Please click the link below to verify your email address:</p>
            <p style="margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SERVER_URL}/verify?token=${(updatedUser as any)._verificationToken}&collection=users" 
                 style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 0;">
                Verify Email
              </a>
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>Best regards,<br/>The DRES Team</p>
          </div>
        `,
      })

      payload.logger.info(`📧 Verification email resent to ${user.email} for user ${user.id}`)
    } catch (emailError) {
      payload.logger.error(`Failed to send verification email: ${emailError}`)
      return Response.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    })
  } catch (error: unknown) {
    payload.logger.error(`Error resending verification: ${error}`)
    return Response.json(
      {
        error: 'Failed to resend verification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
