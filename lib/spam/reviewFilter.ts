import prisma from "@/lib/db/prisma";
import { getTrustScore } from "@/lib/trust/graphBuilder";

/**
 * Spam filtering for reviews
 * Returns reasons why content might be spam, or empty array if clean
 */

export interface SpamCheckResult {
    isSpam: boolean;
    score: number;        // 0-1, higher = more likely spam
    reasons: string[];    // Reasons for spam classification
    action: "allow" | "flag" | "block";
}

// Configuration
const SPAM_CONFIG = {
    // Content thresholds
    minContentLength: 10,
    maxContentLength: 5000,
    maxRepeatedChars: 5,       // Max consecutive same characters
    maxCapsRatio: 0.7,         // Max ratio of CAPS to total
    maxUrlCount: 3,            // Max URLs in review

    // Trust thresholds
    minTrustScoreForAutoApprove: 0.1,  // Auto-approve if trust >= this
    blockIfTrustBelow: 0.02,           // Block if trust < this AND spam score high

    // Rate limiting
    maxReviewsPerHourPerUser: 5,
    maxReviewsPerDayPerUser: 20,

    // Score thresholds
    flagThreshold: 0.4,   // Flag for moderation if score >= this
    blockThreshold: 0.7,  // Auto-block if score >= this
};

/**
 * Suspicious patterns to check for
 */
const SUSPICIOUS_PATTERNS = [
    // Crypto scams
    /(?:free|earn|win)\s*(?:btc|bitcoin|crypto|eth|money)/i,
    /(?:double|multiply)\s*(?:your|my)\s*(?:btc|bitcoin|crypto|money)/i,
    /send\s*(?:btc|bitcoin|crypto).*(?:get|receive|double)/i,

    // Phishing patterns
    /(?:click|visit|go to)\s*(?:this|the)\s*(?:link|url|site)/i,
    /(?:verify|confirm|validate)\s*(?:your|account)/i,

    // Spam patterns
    /(?:buy|order|discount|sale|deal)\s*(?:now|today|here)/i,
    /\$\d+(?:k|,\d{3})?\s*(?:per|a)\s*(?:day|week|month)/i,
    /(?:work\s*from\s*home|make\s*money\s*online)/i,

    // Gibberish detector (too many consonants in a row)
    /[bcdfghjklmnpqrstvwxyz]{7,}/i,

    // Repeated words
    /\b(\w+)\s+\1\s+\1\b/i,
];

/**
 * Known spam phrases (exact matches, case-insensitive)
 */
const SPAM_PHRASES = [
    "check out my profile",
    "dm me for",
    "click here",
    "follow for follow",
    "sub for sub",
    "check bio",
    "link in bio",
    "binary options",
    "forex trading",
    "investment opportunity",
    "guaranteed returns",
];

/**
 * Check if review content is spam
 */
export function checkContentSpam(content: string | null | undefined): {
    score: number;
    reasons: string[];
} {
    const reasons: string[] = [];
    let score = 0;

    if (!content) {
        return { score: 0, reasons: [] };
    }

    const text = content.trim();

    // Length checks
    if (text.length < SPAM_CONFIG.minContentLength) {
        reasons.push("Content too short");
        score += 0.3;
    }

    if (text.length > SPAM_CONFIG.maxContentLength) {
        reasons.push("Content too long");
        score += 0.2;
    }

    // Repeated character check
    const repeatedCharMatch = text.match(/(.)\1{4,}/);
    if (repeatedCharMatch) {
        reasons.push(`Repeated characters: "${repeatedCharMatch[0].substring(0, 10)}"`);
        score += 0.3;
    }

    // ALL CAPS check
    const letters = text.replace(/[^a-zA-Z]/g, "");
    if (letters.length > 10) {
        const capsRatio = (text.match(/[A-Z]/g) || []).length / letters.length;
        if (capsRatio > SPAM_CONFIG.maxCapsRatio) {
            reasons.push("Excessive CAPS usage");
            score += 0.2;
        }
    }

    // URL count check
    const urlMatches = text.match(/https?:\/\/\S+/g);
    if (urlMatches && urlMatches.length > SPAM_CONFIG.maxUrlCount) {
        reasons.push(`Too many URLs (${urlMatches.length})`);
        score += 0.3;
    }

    // Suspicious pattern check
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(text)) {
            reasons.push(`Suspicious pattern detected`);
            score += 0.25;
            break; // Only count once
        }
    }

    // Spam phrase check
    const lowerText = text.toLowerCase();
    for (const phrase of SPAM_PHRASES) {
        if (lowerText.includes(phrase)) {
            reasons.push(`Spam phrase: "${phrase}"`);
            score += 0.4;
            break;
        }
    }

    // Emoji spam check (more than 50% emojis)
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];
    if (emojis.length > 10 && emojis.length / text.length > 0.3) {
        reasons.push("Excessive emoji usage");
        score += 0.2;
    }

    return {
        score: Math.min(score, 1),
        reasons,
    };
}

/**
 * Check rate limiting for user
 */
export async function checkRateLimiting(authorPubkey: string): Promise<{
    score: number;
    reasons: string[];
}> {
    const reasons: string[] = [];
    let score = 0;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count recent reviews
    const [hourlyCount, dailyCount] = await Promise.all([
        prisma.review.count({
            where: {
                authorPubkey: authorPubkey.toLowerCase(),
                indexedAt: { gte: oneHourAgo },
            },
        }),
        prisma.review.count({
            where: {
                authorPubkey: authorPubkey.toLowerCase(),
                indexedAt: { gte: oneDayAgo },
            },
        }),
    ]);

    if (hourlyCount >= SPAM_CONFIG.maxReviewsPerHourPerUser) {
        reasons.push(`Rate limit: ${hourlyCount} reviews in past hour`);
        score += 0.5;
    }

    if (dailyCount >= SPAM_CONFIG.maxReviewsPerDayPerUser) {
        reasons.push(`Rate limit: ${dailyCount} reviews in past day`);
        score += 0.4;
    }

    return { score: Math.min(score, 1), reasons };
}

/**
 * Check for duplicate reviews
 */
export async function checkDuplicates(
    authorPubkey: string,
    osmId: string,
    content: string | null
): Promise<{
    score: number;
    reasons: string[];
}> {
    const reasons: string[] = [];
    let score = 0;

    // Check if user already reviewed this venue
    const existingReview = await prisma.review.findFirst({
        where: {
            authorPubkey: authorPubkey.toLowerCase(),
            venue: { osmId },
        },
    });

    if (existingReview) {
        reasons.push("User already reviewed this venue");
        score += 0.3;

        // Check if content is very similar
        if (content && existingReview.content) {
            const similarity = calculateSimilarity(content, existingReview.content);
            if (similarity > 0.8) {
                reasons.push("Content very similar to existing review");
                score += 0.4;
            }
        }
    }

    return { score: Math.min(score, 1), reasons };
}

/**
 * Simple string similarity (Jaccard index on words)
 */
function calculateSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(/\s+/));
    const wordsB = new Set(b.toLowerCase().split(/\s+/));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

/**
 * Main spam check function
 */
export async function checkReviewSpam(
    authorPubkey: string,
    osmId: string,
    content: string | null,
    rating: number | null
): Promise<SpamCheckResult> {
    const allReasons: string[] = [];
    let totalScore = 0;

    // 1. Content analysis
    const contentCheck = checkContentSpam(content);
    totalScore += contentCheck.score * 0.4; // 40% weight
    allReasons.push(...contentCheck.reasons);

    // 2. Rate limiting
    const rateCheck = await checkRateLimiting(authorPubkey);
    totalScore += rateCheck.score * 0.3; // 30% weight
    allReasons.push(...rateCheck.reasons);

    // 3. Duplicate detection
    const duplicateCheck = await checkDuplicates(authorPubkey, osmId, content);
    totalScore += duplicateCheck.score * 0.3; // 30% weight
    allReasons.push(...duplicateCheck.reasons);

    // 4. Get trust score and adjust
    const trustScore = await getTrustScore(authorPubkey);

    // High trust users get benefit of doubt
    if (trustScore >= SPAM_CONFIG.minTrustScoreForAutoApprove) {
        totalScore *= 0.5; // Halve spam score for trusted users
    }

    // 5. Determine action
    let action: "allow" | "flag" | "block";

    if (totalScore >= SPAM_CONFIG.blockThreshold) {
        action = "block";
    } else if (totalScore >= SPAM_CONFIG.flagThreshold) {
        action = "flag";
    } else {
        action = "allow";
    }

    // Very low trust + high spam = block
    if (trustScore < SPAM_CONFIG.blockIfTrustBelow && totalScore >= SPAM_CONFIG.flagThreshold) {
        action = "block";
        allReasons.push("Low trust score combined with spam indicators");
    }

    return {
        isSpam: action !== "allow",
        score: Math.min(totalScore, 1),
        reasons: allReasons,
        action,
    };
}

/**
 * Quick check for obviously clean reviews (optimization)
 */
export function quickSpamCheck(content: string | null): boolean {
    if (!content) return false;

    const text = content.trim();

    // Quick fail conditions
    if (text.length < SPAM_CONFIG.minContentLength) return true;
    if (text.length > SPAM_CONFIG.maxContentLength) return true;
    if (/(.)\1{7,}/.test(text)) return true; // Very repeated chars

    // Check for obvious spam phrases
    const lowerText = text.toLowerCase();
    for (const phrase of SPAM_PHRASES) {
        if (lowerText.includes(phrase)) return true;
    }

    return false;
}
