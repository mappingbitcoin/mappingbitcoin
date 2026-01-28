import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { subscribeEmail } from "@/lib/db";
import { contactFormLimiter } from "@/lib/rate-limiter";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_THRESHOLD = 0.5;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mappingbitcoin.com";

interface SubscribeRequest {
    email: string;
    list?: string;
    recaptchaToken?: string;
}

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number; error?: string }> {
    if (!RECAPTCHA_SECRET_KEY) {
        console.warn("RECAPTCHA_SECRET_KEY not configured, skipping verification");
        return { success: true };
    }

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: RECAPTCHA_SECRET_KEY,
                response: token,
            }),
        });

        const data = await response.json();

        if (!data.success) {
            return { success: false, error: "reCAPTCHA verification failed" };
        }

        if (data.score < RECAPTCHA_THRESHOLD) {
            return { success: false, score: data.score, error: "Request flagged as suspicious" };
        }

        return { success: true, score: data.score };
    } catch (error) {
        console.error("reCAPTCHA verification error:", error);
        return { success: false, error: "Failed to verify reCAPTCHA" };
    }
}

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    const realIp = request.headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }
    return "unknown";
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
    try {
        const body: SubscribeRequest = await request.json();
        const { email, list = "newsletter", recaptchaToken } = body;

        // Validate email
        if (!email || !validateEmail(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Verify reCAPTCHA if token provided
        if (recaptchaToken) {
            const recaptchaResult = await verifyRecaptcha(recaptchaToken);
            if (!recaptchaResult.success) {
                return NextResponse.json(
                    { error: recaptchaResult.error || "Security verification failed" },
                    { status: 403 }
                );
            }
        }

        // Check rate limits
        const clientIp = getClientIp(request);
        const rateLimitResult = contactFormLimiter.check(clientIp, email);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { error: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Subscribe to list
        const result = await subscribeEmail(email, list);

        if (!result.isNew) {
            return NextResponse.json({
                success: true,
                message: "You are already subscribed to this list.",
                alreadySubscribed: true,
            });
        }

        // Send notification email to admin
        const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${result.subscriber.unsubscribeToken}`;

        await resend.emails.send({
            from: "Mapping Bitcoin <notifications@mappingbitcoin.com>",
            to: ["contact@mappingbitcoin.com"],
            subject: `New Newsletter Subscriber: ${email}`,
            text: `
New subscriber joined the ${list} list!

Email: ${email}
List: ${list}
Date: ${new Date().toISOString()}

---
Mapping Bitcoin Newsletter System
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f7931a; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">New Newsletter Subscriber</h2>
        </div>
        <div class="content">
            <div class="field">
                <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
            </div>
            <div class="field">
                <span class="label">List:</span> ${list}
            </div>
            <div class="field">
                <span class="label">Date:</span> ${new Date().toLocaleString()}
            </div>
        </div>
    </div>
</body>
</html>
            `.trim(),
        });

        // Send welcome email to subscriber
        await resend.emails.send({
            from: "Mapping Bitcoin <newsletter@mappingbitcoin.com>",
            to: [email],
            subject: "Welcome to the Mapping Bitcoin Newsletter!",
            text: `
Welcome to Mapping Bitcoin!

Thank you for subscribing to our newsletter. You'll receive the latest updates about Bitcoin adoption, new features, and insights from our community.

If you ever want to unsubscribe, you can do so here:
${unsubscribeUrl}

Best,
The Mapping Bitcoin Team
            `.trim(),
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0 0 10px 0; font-size: 28px; }
        .header p { margin: 0; opacity: 0.8; }
        .bitcoin-icon { width: 60px; height: 60px; background: #f7931a; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #1a1a2e; margin-top: 0; }
        .content p { color: #555; margin-bottom: 20px; }
        .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #888; }
        .footer a { color: #f7931a; text-decoration: none; }
        .unsubscribe { margin-top: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="bitcoin-icon">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.89-8.9c1.27-.31 2.11-1.33 2.11-2.6 0-1.65-1.35-3-3-3h-2v2h2c.55 0 1 .45 1 1s-.45 1-1 1h-2v2h2c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-2v2h2c2.21 0 4-1.79 4-4 0-1.18-.52-2.23-1.33-2.96.14-.29.22-.61.22-.94z"/>
                </svg>
            </div>
            <h1>Welcome to Mapping Bitcoin!</h1>
            <p>You're now part of our community</p>
        </div>
        <div class="content">
            <h2>Thank you for subscribing!</h2>
            <p>We're excited to have you on board. You'll receive the latest updates about:</p>
            <ul style="color: #555;">
                <li>New Bitcoin-accepting venues worldwide</li>
                <li>Platform features and improvements</li>
                <li>Insights from our global community</li>
                <li>Tips for using Bitcoin in everyday life</li>
            </ul>
            <p>Stay tuned for our next update!</p>
        </div>
        <div class="footer">
            <p>You're receiving this email because you subscribed to the Mapping Bitcoin newsletter.</p>
            <p class="unsubscribe">
                <a href="${unsubscribeUrl}">Unsubscribe</a> |
                <a href="${SITE_URL}">Visit Mapping Bitcoin</a>
            </p>
            <p style="margin-top: 15px;">&copy; 2026 Mapping Bitcoin. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
            `.trim(),
        });

        return NextResponse.json({
            success: true,
            message: "Successfully subscribed! Check your email for confirmation.",
        });
    } catch (error) {
        console.error("Subscribe error:", error);
        return NextResponse.json(
            { error: "Failed to subscribe. Please try again." },
            { status: 500 }
        );
    }
}
