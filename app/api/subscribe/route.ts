import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { subscribeEmail } from "@/lib/db";
import { contactFormLimiter } from "@/lib/rate-limiter";
import { createWelcomeEmail, createSubscriberNotificationEmail } from "@/lib/email/templates";
import { serverEnv, publicEnv } from "@/lib/Environment";
import { validateEmail, checkBodySize } from "@/lib/validation";

const resend = new Resend(serverEnv.resendApiKey);

const RECAPTCHA_THRESHOLD = 0.5;

interface SubscribeRequest {
    email: string;
    list?: string;
    recaptchaToken?: string;
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
    // Check body size (max 10KB for subscribe form)
    const bodySizeCheck = checkBodySize(request, 10 * 1024);
    if (!bodySizeCheck.allowed) {
        return NextResponse.json(
            { error: bodySizeCheck.error },
            { status: 413 }
        );
    }

    try {
        const body: SubscribeRequest = await request.json();
        const { email, list = "newsletter", recaptchaToken } = body;

        // Validate email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return NextResponse.json(
                { error: emailValidation.error || "Invalid email address" },
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
        const unsubscribeUrl = `${publicEnv.siteUrl}/unsubscribe?token=${result.subscriber.unsubscribeToken}`;
        const notificationEmail = createSubscriberNotificationEmail(email, list);

        await resend.emails.send({
            from: "Mapping Bitcoin <notifications@mappingbitcoin.com>",
            to: ["contact@mappingbitcoin.com"],
            subject: `New Newsletter Subscriber: ${email}`,
            text: notificationEmail.text,
            html: notificationEmail.html,
        });

        // Send welcome email to subscriber
        const welcomeEmail = createWelcomeEmail(unsubscribeUrl);

        await resend.emails.send({
            from: "Mapping Bitcoin <newsletter@mappingbitcoin.com>",
            to: [email],
            subject: "Welcome to the Mapping Bitcoin Newsletter!",
            text: welcomeEmail.text,
            html: welcomeEmail.html,
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
