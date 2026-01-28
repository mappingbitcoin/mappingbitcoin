import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { subscribeEmail } from "@/lib/db";
import { contactFormLimiter } from "@/lib/rate-limiter";
import { createWelcomeEmail, createSubscriberNotificationEmail } from "@/lib/email/templates";

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
