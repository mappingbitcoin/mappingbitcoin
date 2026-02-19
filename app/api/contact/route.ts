import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { contactFormLimiter } from "@/lib/rate-limiter";
import { createContactNotificationEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/Environment";
import { validateEmail, sanitizeString, checkBodySize } from "@/lib/validation";

const resend = new Resend(serverEnv.resendApiKey);

const RECAPTCHA_THRESHOLD = 0.5;

interface ContactFormData {
    name: string;
    email: string;
    message: string;
    recaptchaToken: string;
}

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number; error?: string }> {
    const recaptchaSecretKey = serverEnv.recaptchaSecretKey;
    if (!recaptchaSecretKey) {
        console.warn("RECAPTCHA_SECRET_KEY not configured, skipping verification");
        return { success: true };
    }

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: recaptchaSecretKey,
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

export async function POST(request: NextRequest) {
    // Check body size (max 50KB for contact form)
    const bodySizeCheck = checkBodySize(request, 50 * 1024);
    if (!bodySizeCheck.allowed) {
        return NextResponse.json(
            { error: bodySizeCheck.error },
            { status: 413 }
        );
    }

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

        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return NextResponse.json(
                { error: emailValidation.error || "Invalid email address" },
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
        const sanitizedName = sanitizeString(name, 200);
        const sanitizedMessage = sanitizeString(message, 5000);

        // Send email via Resend
        const contactEmail = createContactNotificationEmail(
            sanitizedName,
            email,
            sanitizedMessage,
            { ip: clientIp, recaptchaScore: recaptchaResult.score }
        );

        const { error } = await resend.emails.send({
            from: "Mapping Bitcoin Contact <contact@mappingbitcoin.com>",
            to: ["satoshi@mappingbitcoin.com"],
            replyTo: email,
            subject: `Contact Form: ${sanitizedName}`,
            text: contactEmail.text,
            html: contactEmail.html,
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
