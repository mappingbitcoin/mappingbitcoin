import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit, getClientIP, rateLimiters } from "@/lib/rateLimit";
import { createContactNotificationEmail } from "@/lib/email/templates";
import { serverEnv } from "@/lib/Environment";
import { validateEmail, sanitizeString, checkBodySize } from "@/lib/validation";
import { verifyRecaptcha } from "@/lib/recaptcha";

const resend = new Resend(serverEnv.resendApiKey);

interface ContactFormData {
    name: string;
    email: string;
    message: string;
    recaptchaToken: string;
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
        const clientIp = getClientIP(request);
        const rateLimitResult = checkRateLimit(`contact:${clientIp}`, rateLimiters.sensitive);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    error: "Too many requests from your IP address",
                    resetIn: Math.ceil((rateLimitResult.resetAt - Date.now()) / 60000),
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
