import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail(email: string, orgName: string, token: string) {
  const inviteUrl = `${process.env.AUTH_URL}/invitations/${token}`

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `You've been invited to join ${orgName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1a1a1a;">You've been invited</h1>
              </div>

              <p style="font-size: 16px; margin-bottom: 16px;">Hi there,</p>

              <p style="font-size: 16px; margin-bottom: 16px;">
                You've been invited to join <strong>${orgName}</strong> on SaaS Dashboard.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Accept Invitation
                </a>
              </div>

              <p style="font-size: 14px; color: #737373; margin-bottom: 8px;">
                This invitation expires in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">

              <p style="font-size: 12px; color: #999999; text-align: center;">
                SaaS Dashboard &bull; ${new Date().getFullYear()}
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send invitation email:', error)
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1a1a1a;">Reset your password</h1>

              <p style="font-size: 16px; margin-bottom: 16px;">You requested a password reset. Click the button below to create a new password:</p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>

              <p style="font-size: 14px; color: #737373; margin-bottom: 8px;">
                This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}

export async function sendSecurityAlertEmail(email: string, alert: { type: string; message: string; timestamp: Date }) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: email,
      subject: `Security Alert: ${alert.type}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #ef4444;">Security Alert</h1>

              <p style="font-size: 16px; margin-bottom: 16px;">We detected the following security event on your account:</p>

              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; color: #ef4444;"><strong>${alert.type}</strong></p>
                <p style="margin: 8px 0 0; font-size: 14px; color: #737373;">${alert.message}</p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #999999;">Time: ${alert.timestamp.toLocaleString()}</p>
              </div>

              <p style="font-size: 14px; color: #737373;">
                If this wasn't you, please <a href="${process.env.AUTH_URL}/settings/security" style="color: #6366f1;">secure your account</a> immediately.
              </p>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error('Failed to send security alert email:', error)
  }
}