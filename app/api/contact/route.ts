import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactFormLimiter } from "@/lib/rate-limiter";

const resend = new Resend(process.env.RESEND_API_KEY);

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_THRESHOLD = 0.5;

interface ContactFormData {
    name: string;
    email: string;
    message: string;
    recaptchaToken: string;
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

function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/<[^>]*>/g, "")
        .substring(0, 5000);
}

export async function POST(request: NextRequest) {
    try {
        const body: ContactFormData = await request.json();
        const { name, email, message, recaptchaToken } = body;

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!validateEmail(email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            );
        }

        // Verify reCAPTCHA
        if (!recaptchaToken) {
            return NextResponse.json(
                { error: "reCAPTCHA token required" },
                { status: 400 }
            );
        }

        const recaptchaResult = await verifyRecaptcha(recaptchaToken);
        if (!recaptchaResult.success) {
            console.warn(`reCAPTCHA failed for email ${email}: ${recaptchaResult.error}`);
            return NextResponse.json(
                { error: recaptchaResult.error || "Security verification failed" },
                { status: 403 }
            );
        }

        // Check rate limits
        const clientIp = getClientIp(request);
        const rateLimitResult = contactFormLimiter.check(clientIp, email);

        if (!rateLimitResult.allowed) {
            const resetInMinutes = Math.ceil(rateLimitResult.resetIn / 60000);
            return NextResponse.json(
                {
                    error: rateLimitResult.reason || "Too many requests",
                    resetIn: resetInMinutes,
                },
                { status: 429 }
            );
        }

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedMessage = sanitizeInput(message);

        // Send email via Resend
        const { error } = await resend.emails.send({
            from: "Mapping Bitcoin Contact <contact@mappingbitcoin.com>",
            to: ["satoshi@mappingbitcoin.com"],
            replyTo: email,
            subject: `Contact Form: ${sanitizedName}`,
            text: `
Name: ${sanitizedName}
Email: ${email}
IP: ${clientIp}
reCAPTCHA Score: ${recaptchaResult.score ?? "N/A"}

Message:
${sanitizedMessage}
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
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #666; }
        .message { background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #f7931a; margin-top: 10px; }
        .meta { font-size: 12px; color: #999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">New Contact Form Submission</h2>
        </div>
        <div class="content">
            <div class="field">
                <span class="label">Name:</span> ${sanitizedName}
            </div>
            <div class="field">
                <span class="label">Email:</span> <a href="mailto:${email}">${email}</a>
            </div>
            <div class="field">
                <span class="label">Message:</span>
                <div class="message">${sanitizedMessage.replace(/\n/g, "<br>")}</div>
            </div>
            <div class="meta">
                IP Address: ${clientIp}<br>
                reCAPTCHA Score: ${recaptchaResult.score ?? "N/A"}
            </div>
        </div>
    </div>
</body>
</html>
            `.trim(),
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json(
                { error: "Failed to send email" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact form error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
