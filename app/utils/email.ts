import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_KEY)

export interface EmailData {
  to: string
  subject: string
  html: string
}

export async function sendEmail(emailData: EmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Saveenv <noreply@contact.saveenv.com>',
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    })

    if (error) {
      console.error('Error sending email:', error)
      throw new Error('Failed to send email')
    }

    return data
  } catch (error) {
    console.error('Error in sendEmail function:', error)
    throw error
  }
}

export function generateResetPasswordEmailHTML(
  email: string,
  compoundToken: string
) {
  const localhost = `${'http://localhost:3000'}/login/reset?t=${encodeURIComponent(compoundToken)}`
  const production = `${'https://saveenv.com'}/login/reset?t=${encodeURIComponent(compoundToken)}`
  const resetUrl = process.env.NODE_ENV === 'production' ? production : localhost
  return `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset - Saveenv</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; padding: 20px; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
    .header { background-color: #1f2937; padding: 32px; text-align: center; }
    .header h1 { font-size: 22px; font-weight: 600; color: #ffffff; }
    .content { padding: 32px; }
    .intro { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
    .cta { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #1f2937; color:  #ffffff !important; font-weight: 600; font-size: 16px; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
    .info { background: #f8fafc; border: 1px solid #e5e7eb; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 6px; color: #1f2937; font-size: 14px; }
    .footer { background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Reset your password</h1>
    </div>
    <div class="content">
      <p class="intro">We received a request to reset the password for <strong>${email}</strong>.</p>
      <div class="cta">
        <a href="${resetUrl}" class="btn">Create a new password</a>
      </div>
      <div class="info">
        This link will expire in 5 minutes. If you did not request this, you can ignore this email and your password will remain unchanged.
      </div>
    </div>
    <div class="footer">
      <p><strong>Saveenv</strong></p>
      <p>© 2024 Saveenv. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `
}
export function generateInvitationEmailHTML(
  inviteeEmail: string,
  projectName: string,
  organizationName: string,
  role: string,
  token: string
) {
  const localhost=`${'http://localhost:3000'}/invite/accept?token=${token}`
  const production=`${'https://saveenv.com'}/invite/accept?token=${token}`
  const acceptUrl = process.env.NODE_ENV==='production'?production:localhost
    const getRoleText = () => {
    switch (role) {
      case 'ADMIN': return 'Administrator'
      case 'LEAD': return 'Project Lead'
      default: return 'Team Member'
    }
  }
 return `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: Project Invitation - Saveenv</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #374151;
      background-color: #f9fafb;
      padding: 20px;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .header { 
      background-color: #1f2937;
      padding: 40px 32px; 
      text-align: center; 
    }
    
    .header h1 { 
      font-size: 24px; 
      font-weight: 600; 
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    
    .header p { 
      font-size: 16px; 
      color: #d1d5db;
      font-weight: 400;
    }
    
    .content { 
      padding: 40px 32px; 
    }
    
    .greeting { 
      font-size: 18px; 
      font-weight: 600; 
      color: #111827;
      margin-bottom: 24px;
    }
    
    .intro-text { 
      font-size: 16px; 
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    
    .project-details {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 24px;
      margin: 32px 0;
    }
    
    .project-details h3 {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
    }
    
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    
    .role-badge { 
      background-color: #059669;
      color: #ffffff;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    
    .accept-button { 
      display: inline-block;
      background-color: #1f2937;
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }
    
    .accept-button:hover {
      background-color: #111827;
    }
    
    .warning-section {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin: 32px 0;
    }
    
    .warning-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 4px;
    }
    
    .warning-text {
      font-size: 14px;
      color: #92400e;
    }
    
    .footer-note {
      font-size: 14px;
      color: #6b7280;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer { 
      background-color: #f8fafc;
      padding: 24px 32px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .footer p { 
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .footer p:last-child { 
      margin-bottom: 0; 
    }
    
    @media (max-width: 600px) {
      body { 
        padding: 10px; 
      }
      
      .header, .content, .footer { 
        padding-left: 20px;
        padding-right: 20px;
      }
      
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Project Invitation</h1>
      <p>Saveenv - Project Management Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello,</div>
      
      <div class="intro-text">
        You have been invited to participate in a project on our platform. 
        Your collaboration will be essential for the team's success.
      </div>
      
      <div class="project-details">
        <h3>Invitation Details</h3>
        <div class="detail-row">
          <span class="detail-label">Project:</span>
          <span class="detail-value">${projectName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organization:</span>
          <span class="detail-value">${organizationName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role:</span>
          <span class="role-badge">${getRoleText()}</span>
        </div>
     
      </div>
      
      <div class="cta-section">
        <div class="cta-text">
          To accept this invitation and access the project, click the button below:
        </div>

        <a href="${acceptUrl}" class="accept-button">Accept Invitation</a>
      </div>
      
      <div class="warning-section">
        <div class="warning-title">Important:</div>
        <div class="warning-text">
          This invitation expires in 7 days. If you have trouble accessing the link, 
          please contact the project administrator.
        </div>
      </div>
      
      <div class="footer-note">
        If you don't recognize this invitation or received it by mistake, 
        you can safely ignore this email.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Saveenv</strong></p>
      <p>© 2024 Saveenv. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
 `
}

export function generateInvitationResentEmailHTML(
  inviteeEmail: string,
  projectName: string,
  organizationName: string,
  role: string,
  token: string
) {
  const localhost=`${'http://localhost:3000'}/invite/accept?token=${token}`
  const production=`${'https://saveenv.com'}/invite/accept?token=${token}`
  const acceptUrl = process.env.NODE_ENV==='production'?production:localhost
  
      const getRoleText = () => {
    switch (role) {
      case 'ADMIN': return 'Administrator'
      case 'LEAD': return 'Project Lead'
      default: return 'Team Member'
    }
  }
 return `
  <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview: Project Invitation - Saveenv</title>
  <style>
    * { 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #374151;
      background-color: #f9fafb;
      padding: 20px;
    }
    
    .email-container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .header { 
      background-color: #1f2937;
      padding: 40px 32px; 
      text-align: center; 
    }
    
    .header h1 { 
      font-size: 24px; 
      font-weight: 600; 
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.025em;
    }
    
    .header p { 
      font-size: 16px; 
      color: #d1d5db;
      font-weight: 400;
    }
    
    .content { 
      padding: 40px 32px; 
    }
    
    .greeting { 
      font-size: 18px; 
      font-weight: 600; 
      color: #111827;
      margin-bottom: 24px;
    }
    
    .intro-text { 
      font-size: 16px; 
      color: #4b5563;
      margin-bottom: 32px;
      line-height: 1.7;
    }
    
    .project-details {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 24px;
      margin: 32px 0;
    }
    
    .project-details h3 {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .detail-row:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
    }
    
    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }
    
    .role-badge { 
      background-color: #059669;
      color: #ffffff;
      font-weight: 500;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    
    .cta-text {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    
    .accept-button { 
      display: inline-block;
      background-color: #1f2937;
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
      padding: 12px 32px;
      text-decoration: none;
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }
    
    .accept-button:hover {
      background-color: #111827;
    }
    
    .warning-section {
      background-color: #fef3c7;
      border: 1px solid #fbbf24;
      border-left: 4px solid #f59e0b;
      border-radius: 6px;
      padding: 16px;
      margin: 32px 0;
    }
    
    .warning-title {
      font-size: 14px;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 4px;
    }
    
    .warning-text {
      font-size: 14px;
      color: #92400e;
    }
    
    .footer-note {
      font-size: 14px;
      color: #6b7280;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer { 
      background-color: #f8fafc;
      padding: 24px 32px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .footer p { 
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .footer p:last-child { 
      margin-bottom: 0; 
    }
    
    @media (max-width: 600px) {
      body { 
        padding: 10px; 
      }
      
      .header, .content, .footer { 
        padding-left: 20px;
        padding-right: 20px;
      }
      
      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Project Invitation</h1>
      <p>Saveenv - Project Management Platform</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello,</div>
      
      <div class="intro-text">
        You have been invited to participate in a project on our platform. 
        Your collaboration will be essential for the team's success.
      </div>
      
      <div class="project-details">
        <h3>Invitation Details</h3>
        <div class="detail-row">
          <span class="detail-label">Project:</span>
          <span class="detail-value">${projectName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Organization:</span>
          <span class="detail-value">${organizationName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role:</span>
          <span class="role-badge">${getRoleText()}</span>
        </div>
     
      </div>
      
      <div class="cta-section">
        <div class="cta-text">
          To accept this invitation and access the project, click the button below:
        </div>

        <a href="${acceptUrl}" class="accept-button">Accept Invitation</a>
      </div>
      
      <div class="warning-section">
        <div class="warning-title">Important:</div>
        <div class="warning-text">
          This invitation expires in 7 days. If you have trouble accessing the link, 
          please contact the project administrator.
        </div>
      </div>
      
      <div class="footer-note">
        If you don't recognize this invitation or received it by mistake, 
        you can safely ignore this email.
      </div>
    </div>
    
    <div class="footer">
      <p><strong>Saveenv</strong></p>
      <p>© 2024 Saveenv. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
 `
}