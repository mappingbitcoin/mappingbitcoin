/**
 * Centralized email templates for Mapping Bitcoin
 *
 * Brand Colors:
 * - Primary Orange: #f7931a (Bitcoin orange)
 * - Dark Blue: #1a1a2e
 * - Dark Blue Gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mappingbitcoin.com";
const CURRENT_YEAR = new Date().getFullYear();

// Bitcoin logo SVG for emails
const BITCOIN_LOGO_SVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="16" fill="#F7931A"/>
  <path d="M22.5 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.9-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.3-.1-.7-.2-1-.2v-.1l-2.3-.6-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .2.1h-.2l-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3l-.8 1.9 2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.8c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2.1-.1-3.3-1.5-4.1 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2.1-4 1-5.1.7l.9-3.7c1.1.3 4.8.8 4.2 3zm.5-5.4c-.5 1.9-3.4.9-4.3.7l.8-3.4c1 .2 4 .7 3.5 2.7z" fill="white"/>
</svg>`;

// Shared CSS styles
const BASE_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333333;
    background-color: #f5f5f5;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  .wrapper {
    width: 100%;
    background-color: #f5f5f5;
    padding: 40px 20px;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  .header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    color: #ffffff;
    padding: 40px 30px;
    text-align: center;
  }
  .header-logo {
    margin-bottom: 20px;
  }
  .header h1 {
    margin: 0 0 8px 0;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .header p {
    margin: 0;
    opacity: 0.85;
    font-size: 15px;
  }
  .content {
    padding: 40px 30px;
  }
  .content h2 {
    color: #1a1a2e;
    margin: 0 0 16px 0;
    font-size: 22px;
    font-weight: 600;
  }
  .content p {
    color: #555555;
    margin: 0 0 16px 0;
    font-size: 15px;
  }
  .content ul {
    color: #555555;
    margin: 0 0 16px 0;
    padding-left: 20px;
  }
  .content li {
    margin-bottom: 8px;
  }
  .button {
    display: inline-block;
    background: #f7931a;
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 15px;
    margin: 8px 0;
    transition: background 0.2s;
  }
  .button:hover {
    background: #e8850f;
  }
  .button-secondary {
    background: #1a1a2e;
  }
  .code-box {
    background: linear-gradient(135deg, #f7931a 0%, #e8850f 100%);
    color: #ffffff;
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 10px;
    padding: 24px 40px;
    border-radius: 12px;
    display: inline-block;
    margin: 24px 0;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  }
  .info-box {
    background: #f8f9fa;
    border-left: 4px solid #f7931a;
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
    margin: 20px 0;
  }
  .info-box p {
    margin: 0;
    color: #555555;
  }
  .divider {
    height: 1px;
    background: #e5e5e5;
    margin: 24px 0;
  }
  .footer {
    background: #f8f9fa;
    padding: 30px;
    text-align: center;
    border-top: 1px solid #e5e5e5;
  }
  .footer p {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: #888888;
  }
  .footer a {
    color: #f7931a;
    text-decoration: none;
  }
  .footer a:hover {
    text-decoration: underline;
  }
  .footer-links {
    margin: 16px 0;
  }
  .footer-links a {
    margin: 0 12px;
  }
  .social-links {
    margin: 16px 0 8px 0;
  }
  .social-links a {
    display: inline-block;
    margin: 0 8px;
    opacity: 0.7;
    transition: opacity 0.2s;
  }
  .social-links a:hover {
    opacity: 1;
  }
  .field {
    margin-bottom: 12px;
  }
  .field-label {
    font-weight: 600;
    color: #666666;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }
  .field-value {
    color: #333333;
    font-size: 15px;
  }
  .badge {
    display: inline-block;
    background: #e8f5e9;
    color: #2e7d32;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge-warning {
    background: #fff3e0;
    color: #ef6c00;
  }
  .badge-info {
    background: #e3f2fd;
    color: #1565c0;
  }
  .muted {
    color: #888888;
    font-size: 13px;
  }
  @media only screen and (max-width: 620px) {
    .wrapper {
      padding: 20px 10px;
    }
    .header {
      padding: 30px 20px;
    }
    .header h1 {
      font-size: 22px;
    }
    .content {
      padding: 30px 20px;
    }
    .code-box {
      font-size: 28px;
      letter-spacing: 6px;
      padding: 20px 24px;
    }
    .footer {
      padding: 24px 20px;
    }
  }
`;

export interface EmailTemplateOptions {
    title: string;
    subtitle?: string;
    preheader?: string;
    showLogo?: boolean;
    unsubscribeUrl?: string;
    unsubscribeReason?: string;
}

/**
 * Base email template wrapper
 */
export function createEmailTemplate(
    content: string,
    options: EmailTemplateOptions
): string {
    const {
        title,
        subtitle,
        preheader,
        showLogo = true,
        unsubscribeUrl,
        unsubscribeReason = "You're receiving this email because you have an account or subscription with Mapping Bitcoin.",
    } = options;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    ${preheader ? `<!--[if !mso]><!--><span style="display:none;font-size:1px;color:#f5f5f5;max-height:0;overflow:hidden;">${preheader}</span><!--<![endif]-->` : ""}
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                ${showLogo ? `<div class="header-logo">${BITCOIN_LOGO_SVG}</div>` : ""}
                <h1>${title}</h1>
                ${subtitle ? `<p>${subtitle}</p>` : ""}
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <div class="footer-links">
                    <a href="${SITE_URL}">Visit Website</a>
                    <a href="${SITE_URL}/about">About</a>
                    <a href="${SITE_URL}/contact">Contact</a>
                </div>
                <p>${unsubscribeReason}</p>
                ${unsubscribeUrl ? `<p><a href="${unsubscribeUrl}">Unsubscribe</a></p>` : ""}
                <p style="margin-top: 16px;">&copy; ${CURRENT_YEAR} Mapping Bitcoin. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Verification code email template
 */
export function createVerificationCodeEmail(
    code: string,
    venueName?: string,
    expiryMinutes: number = 15
): { html: string; text: string } {
    const venueText = venueName ? ` for "${venueName}"` : "";

    const html = createEmailTemplate(
        `
        <h2>Verify Your Ownership</h2>
        <p>You're verifying venue ownership${venueText} on Mapping Bitcoin. Enter the code below to complete verification:</p>
        <div style="text-align: center;">
            <div class="code-box">${code}</div>
        </div>
        <div class="info-box">
            <p><strong>This code expires in ${expiryMinutes} minutes.</strong></p>
        </div>
        <p class="muted">If you didn't request this verification code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
        `,
        {
            title: "Verification Code",
            subtitle: `Your code: ${code}`,
            preheader: `Your Mapping Bitcoin verification code is ${code}`,
            unsubscribeReason: "You're receiving this email because you requested to verify a venue on Mapping Bitcoin.",
        }
    );

    const text = `
Your Mapping Bitcoin Verification Code

You're verifying ownership${venueText} on Mapping Bitcoin.

Your verification code is: ${code}

This code expires in ${expiryMinutes} minutes.

If you didn't request this code, you can safely ignore this email.

---
Mapping Bitcoin
${SITE_URL}
    `.trim();

    return { html, text };
}

/**
 * Welcome/Newsletter subscription email template
 */
export function createWelcomeEmail(unsubscribeUrl: string): { html: string; text: string } {
    const html = createEmailTemplate(
        `
        <h2>Thank you for subscribing!</h2>
        <p>We're excited to have you join the Mapping Bitcoin community. You'll receive the latest updates about:</p>
        <ul>
            <li>New Bitcoin-accepting venues worldwide</li>
            <li>Platform features and improvements</li>
            <li>Insights from our global community</li>
            <li>Tips for using Bitcoin in everyday life</li>
        </ul>
        <div class="divider"></div>
        <p>Stay tuned for our next update!</p>
        <div style="text-align: center; margin-top: 24px;">
            <a href="${SITE_URL}/places" class="button">Explore Venues</a>
        </div>
        `,
        {
            title: "Welcome to Mapping Bitcoin!",
            subtitle: "You're now part of our community",
            preheader: "Thank you for subscribing to the Mapping Bitcoin newsletter",
            unsubscribeUrl,
            unsubscribeReason: "You're receiving this email because you subscribed to the Mapping Bitcoin newsletter.",
        }
    );

    const text = `
Welcome to Mapping Bitcoin!

Thank you for subscribing to our newsletter. You'll receive the latest updates about Bitcoin adoption, new features, and insights from our community.

What to expect:
- New Bitcoin-accepting venues worldwide
- Platform features and improvements
- Insights from our global community
- Tips for using Bitcoin in everyday life

If you ever want to unsubscribe, you can do so here:
${unsubscribeUrl}

Best,
The Mapping Bitcoin Team

---
${SITE_URL}
    `.trim();

    return { html, text };
}

/**
 * Contact form notification email template (internal)
 */
export function createContactNotificationEmail(
    name: string,
    email: string,
    message: string,
    metadata?: { ip?: string; recaptchaScore?: number }
): { html: string; text: string } {
    const html = createEmailTemplate(
        `
        <h2>New Contact Form Submission</h2>
        <div class="field">
            <div class="field-label">Name</div>
            <div class="field-value">${name}</div>
        </div>
        <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value"><a href="mailto:${email}">${email}</a></div>
        </div>
        <div class="divider"></div>
        <div class="field">
            <div class="field-label">Message</div>
            <div class="info-box">
                <p>${message.replace(/\n/g, "<br>")}</p>
            </div>
        </div>
        ${metadata ? `
        <div class="divider"></div>
        <p class="muted">
            ${metadata.ip ? `IP Address: ${metadata.ip}` : ""}
            ${metadata.ip && metadata.recaptchaScore !== undefined ? " | " : ""}
            ${metadata.recaptchaScore !== undefined ? `reCAPTCHA Score: ${metadata.recaptchaScore}` : ""}
        </p>
        ` : ""}
        `,
        {
            title: "Contact Form",
            subtitle: `From: ${name}`,
            preheader: `New message from ${name}: ${message.substring(0, 50)}...`,
            showLogo: true,
            unsubscribeReason: "This is an internal notification for the Mapping Bitcoin team.",
        }
    );

    const text = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${metadata?.ip ? `IP: ${metadata.ip}` : ""}
${metadata?.recaptchaScore !== undefined ? `reCAPTCHA Score: ${metadata.recaptchaScore}` : ""}

Message:
${message}

---
Mapping Bitcoin Contact System
    `.trim();

    return { html, text };
}

/**
 * New subscriber notification email template (internal)
 */
export function createSubscriberNotificationEmail(
    email: string,
    list: string
): { html: string; text: string } {
    const html = createEmailTemplate(
        `
        <h2>New Subscriber</h2>
        <div class="badge badge-info" style="margin-bottom: 20px;">Newsletter</div>
        <div class="field">
            <div class="field-label">Email</div>
            <div class="field-value"><a href="mailto:${email}">${email}</a></div>
        </div>
        <div class="field">
            <div class="field-label">List</div>
            <div class="field-value">${list}</div>
        </div>
        <div class="field">
            <div class="field-label">Date</div>
            <div class="field-value">${new Date().toLocaleString()}</div>
        </div>
        `,
        {
            title: "New Subscriber",
            subtitle: email,
            preheader: `New newsletter subscriber: ${email}`,
            showLogo: true,
            unsubscribeReason: "This is an internal notification for the Mapping Bitcoin team.",
        }
    );

    const text = `
New Newsletter Subscriber

Email: ${email}
List: ${list}
Date: ${new Date().toISOString()}

---
Mapping Bitcoin Newsletter System
    `.trim();

    return { html, text };
}

/**
 * Verification success email template
 */
export function createVerificationSuccessEmail(
    venueName: string,
    venueUrl: string
): { html: string; text: string } {
    const html = createEmailTemplate(
        `
        <div style="text-align: center; margin-bottom: 24px;">
            <div class="badge" style="font-size: 14px; padding: 8px 16px;">Verified Owner</div>
        </div>
        <h2>Congratulations!</h2>
        <p>You've successfully verified your ownership of <strong>${venueName}</strong> on Mapping Bitcoin.</p>
        <div class="info-box">
            <p>Your venue now displays a "Verified Owner" badge, helping customers know they're dealing with the legitimate business.</p>
        </div>
        <p>As a verified owner, you can:</p>
        <ul>
            <li>Respond to customer reviews</li>
            <li>Update your venue information</li>
            <li>Access owner analytics (coming soon)</li>
        </ul>
        <div style="text-align: center; margin-top: 24px;">
            <a href="${venueUrl}" class="button">View Your Venue</a>
        </div>
        `,
        {
            title: "Ownership Verified!",
            subtitle: venueName,
            preheader: `You've verified ownership of ${venueName} on Mapping Bitcoin`,
            unsubscribeReason: "You're receiving this email because you verified a venue on Mapping Bitcoin.",
        }
    );

    const text = `
Ownership Verified!

Congratulations! You've successfully verified your ownership of "${venueName}" on Mapping Bitcoin.

Your venue now displays a "Verified Owner" badge, helping customers know they're dealing with the legitimate business.

As a verified owner, you can:
- Respond to customer reviews
- Update your venue information
- Access owner analytics (coming soon)

View your venue: ${venueUrl}

---
Mapping Bitcoin
${SITE_URL}
    `.trim();

    return { html, text };
}

/**
 * Verification revoked email template
 */
export function createVerificationRevokedEmail(
    venueName: string,
    reason: string,
    venueUrl: string
): { html: string; text: string } {
    const reasonText = reason === "email_changed"
        ? "The email address associated with this venue on OpenStreetMap has changed."
        : reason;

    const html = createEmailTemplate(
        `
        <div style="text-align: center; margin-bottom: 24px;">
            <div class="badge badge-warning" style="font-size: 14px; padding: 8px 16px;">Verification Revoked</div>
        </div>
        <h2>Verification Status Changed</h2>
        <p>Your ownership verification for <strong>${venueName}</strong> has been revoked.</p>
        <div class="info-box">
            <p><strong>Reason:</strong> ${reasonText}</p>
        </div>
        <p>To re-verify your ownership, please visit your venue page and complete the verification process again.</p>
        <div style="text-align: center; margin-top: 24px;">
            <a href="${venueUrl}" class="button">Re-verify Ownership</a>
        </div>
        `,
        {
            title: "Verification Revoked",
            subtitle: venueName,
            preheader: `Your ownership verification for ${venueName} has been revoked`,
            unsubscribeReason: "You're receiving this email because you previously verified a venue on Mapping Bitcoin.",
        }
    );

    const text = `
Verification Revoked

Your ownership verification for "${venueName}" has been revoked.

Reason: ${reasonText}

To re-verify your ownership, please visit your venue page and complete the verification process again.

Venue page: ${venueUrl}

---
Mapping Bitcoin
${SITE_URL}
    `.trim();

    return { html, text };
}
