/**
 * Marketing Content Seeder
 *
 * Run with: npx tsx scripts/seed-marketing.ts
 *
 * This script seeds the marketing tables with initial content.
 * It uses upsert patterns to avoid duplicates when run multiple times.
 */

import "dotenv/config";
import { PrismaClient, SocialNetwork } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedGuidelines() {
    console.log("Seeding marketing guidelines...");

    const voiceTone = `Mapping Bitcoin speaks with the confident clarity of someone who genuinely believes Bitcoin adoption should be easy. Our tone is friendly but authoritative—we're the helpful expert, not the condescending one. We're excited about merchant adoption without being preachy. We acknowledge complexity while making it feel manageable.

Core voice attributes:
- **Approachable expertise**: We know our stuff but never talk down
- **Action-oriented**: Every message should make the next step obvious
- **Globally minded, locally relevant**: Bitcoin is worldwide, but spending is local
- **Community-first**: We highlight merchants and Bitcoiners, not just ourselves`;

    const doList = [
        "Use active voice and clear, direct language",
        "Celebrate merchant wins and community growth",
        "Include specific numbers when available (X merchants in Y countries)",
        "Make Bitcoin spending feel normal and accessible",
        "Acknowledge the global community",
        "Use \"Mapping Bitcoin\" as two words (not \"MappingBitcoin\")",
        "Reference the map as a practical tool",
        "Highlight circular economy benefits",
        "Keep regional content locally relevant"
    ];

    const dontList = [
        "Use crypto jargon without context (no \"HODL,\" \"diamond hands,\" \"moon\")",
        "Be preachy about Bitcoin maximalism",
        "Criticize other payment methods or fiat directly",
        "Promise returns or financial outcomes",
        "Use hype language (\"game-changing,\" \"revolutionary\")",
        "Ignore merchant verification and trust signals",
        "Forget to credit community contributors when relevant",
        "Make claims without data to back them up",
        "Use overly technical language for general audiences"
    ];

    const brandValues = [
        "**Utility First**: We exist to make Bitcoin spending practical",
        "**Trust Through Verification**: Verified listings build confidence",
        "**Community-Powered**: Bitcoiners helping Bitcoiners find places to spend",
        "**Global Reach, Local Impact**: One map serving every Bitcoin community worldwide",
        "**Open and Transparent**: Built on open protocols (Nostr), accessible to all",
        "**Merchant-Friendly**: We want businesses to succeed with Bitcoin",
        "**Action Over Speculation**: Spending Bitcoin > talking about price"
    ];

    const existing = await prisma.marketingGuidelines.findFirst();

    if (existing) {
        await prisma.marketingGuidelines.update({
            where: { id: existing.id },
            data: { voiceTone, doList, dontList, brandValues }
        });
        console.log("  Updated existing guidelines");
    } else {
        await prisma.marketingGuidelines.create({
            data: { voiceTone, doList, dontList, brandValues }
        });
        console.log("  Created new guidelines");
    }
}

async function seedLinks() {
    console.log("Seeding marketing links...");

    const links = [
        // Website links
        { title: "Main Website", url: "https://mappingbitcoin.com", description: "Primary landing page", category: "website" },
        { title: "Merchant Map", url: "https://mappingbitcoin.com/map", description: "Interactive map of Bitcoin-accepting merchants", category: "website" },
        { title: "Add a Place", url: "https://mappingbitcoin.com/places/create", description: "Form for adding new merchant listings", category: "website" },

        // Product links
        { title: "BTC Map Integration", url: "https://btcmap.org", description: "Main data source for merchant locations", category: "product" },
        { title: "Nostr Protocol", url: "https://nostr.com", description: "The open protocol powering our reviews", category: "product" },

        // Legal links
        { title: "Privacy Policy", url: "https://mappingbitcoin.com/privacy", description: "Our privacy practices", category: "legal" },
        { title: "Terms of Service", url: "https://mappingbitcoin.com/terms", description: "Usage terms", category: "legal" },

        // Directory links (by region/country)
        { title: "United States Directory", url: "https://mappingbitcoin.com/united-states", description: "All US merchants accepting Bitcoin", category: "directory" },
        { title: "Germany Directory", url: "https://mappingbitcoin.com/germany", description: "All German merchants accepting Bitcoin", category: "directory" },
        { title: "Argentina Directory", url: "https://mappingbitcoin.com/argentina", description: "All Argentine merchants accepting Bitcoin", category: "directory" },
        { title: "Japan Directory", url: "https://mappingbitcoin.com/japan", description: "All Japanese merchants accepting Bitcoin", category: "directory" },
        { title: "El Salvador Directory", url: "https://mappingbitcoin.com/el-salvador", description: "All Salvadoran merchants accepting Bitcoin", category: "directory" },
        { title: "Brazil Directory", url: "https://mappingbitcoin.com/brazil", description: "All Brazilian merchants accepting Bitcoin", category: "directory" },
        { title: "Spain Directory", url: "https://mappingbitcoin.com/spain", description: "All Spanish merchants accepting Bitcoin", category: "directory" },
    ];

    for (const link of links) {
        const existing = await prisma.marketingLink.findFirst({
            where: { url: link.url }
        });

        if (!existing) {
            await prisma.marketingLink.create({ data: link });
            console.log(`  Created link: ${link.title}`);
        } else {
            console.log(`  Skipped (exists): ${link.title}`);
        }
    }
}

async function seedHashtags() {
    console.log("Seeding hashtag sets...");

    const hashtagSets = [
        {
            name: "Bitcoin Spending",
            hashtags: ["SpendBitcoin", "BitcoinAccepted", "PayWithBitcoin", "BitcoinPayments", "UseBitcoin"],
            socialNetworks: [SocialNetwork.TWITTER, SocialNetwork.NOSTR, SocialNetwork.INSTAGRAM],
            description: "Core hashtags for promoting Bitcoin as a spending medium"
        },
        {
            name: "Merchant Focused",
            hashtags: ["BitcoinMerchants", "AcceptBitcoin", "BitcoinBusiness", "BitcoinCommerce", "MerchantAdoption"],
            socialNetworks: [SocialNetwork.TWITTER, SocialNetwork.LINKEDIN],
            description: "Hashtags targeting merchants and business adoption"
        },
        {
            name: "Educational",
            hashtags: ["Bitcoin", "BitcoinEducation", "LearnBitcoin", "BitcoinBasics", "Cryptocurrency"],
            socialNetworks: [SocialNetwork.TWITTER, SocialNetwork.INSTAGRAM, SocialNetwork.YOUTUBE],
            description: "General educational and awareness hashtags"
        },
        {
            name: "Technical/Builder",
            hashtags: ["BuildOnBitcoin", "LightningNetwork", "Nostr", "OpenSource", "Bitcoin"],
            socialNetworks: [SocialNetwork.TWITTER, SocialNetwork.NOSTR],
            description: "For developer and technical community engagement"
        },
        {
            name: "Regional (Spanish)",
            hashtags: ["BitcoinEnEspañol", "BitcoinLatam", "BitcoinArgentina", "BitcoinElSalvador", "BitcoinMexico"],
            socialNetworks: [SocialNetwork.TWITTER, SocialNetwork.INSTAGRAM],
            description: "Spanish-language regional hashtags"
        }
    ];

    for (const set of hashtagSets) {
        const existing = await prisma.hashtagSet.findFirst({
            where: { name: set.name }
        });

        if (!existing) {
            await prisma.hashtagSet.create({ data: set });
            console.log(`  Created hashtag set: ${set.name}`);
        } else {
            await prisma.hashtagSet.update({
                where: { id: existing.id },
                data: set
            });
            console.log(`  Updated hashtag set: ${set.name}`);
        }
    }
}

async function seedStats() {
    console.log("Seeding marketing stats...");

    const stats = [
        // Reach stats
        { label: "Total Merchants Listed", value: "10,000+", source: "BTC Map API", category: "reach" },
        { label: "Countries Covered", value: "150+", source: "BTC Map API", category: "reach" },
        { label: "Daily Active Map Users", value: "2,500+", source: "Internal Analytics", category: "reach" },
        { label: "Monthly Merchant Searches", value: "50,000+", source: "Internal Analytics", category: "reach" },
        { label: "Verified Merchants", value: "3,500+", source: "Internal Database", category: "reach" },
        { label: "Community Reviews", value: "8,000+", source: "Nostr Protocol", category: "reach" },

        // Regional stats
        { label: "US Merchants", value: "2,100+", source: "BTC Map API", category: "regional" },
        { label: "El Salvador Merchants", value: "1,800+", source: "BTC Map API", category: "regional" },
        { label: "Germany Merchants", value: "890+", source: "BTC Map API", category: "regional" },
        { label: "Argentina Merchants", value: "620+", source: "BTC Map API", category: "regional" },
        { label: "Brazil Merchants", value: "480+", source: "BTC Map API", category: "regional" },
        { label: "Japan Merchants", value: "350+", source: "BTC Map API", category: "regional" },
        { label: "Spain Merchants", value: "420+", source: "BTC Map API", category: "regional" },

        // Product stats
        { label: "Categories Available", value: "25+", source: "Internal Database", category: "product" },
        { label: "Languages Supported", value: "12", source: "Internal", category: "product" },
        { label: "Mobile-Friendly", value: "100%", source: "Technical", category: "product" },
        { label: "API Response Time", value: "<200ms", source: "Technical", category: "product" },
        { label: "Data Update Frequency", value: "Every 15 min", source: "Technical", category: "product" },
        { label: "Open Source", value: "Yes", source: "GitHub", category: "product" },
    ];

    for (const stat of stats) {
        const existing = await prisma.marketingStat.findFirst({
            where: { label: stat.label }
        });

        if (!existing) {
            await prisma.marketingStat.create({ data: stat });
            console.log(`  Created stat: ${stat.label}`);
        } else {
            await prisma.marketingStat.update({
                where: { id: existing.id },
                data: stat
            });
            console.log(`  Updated stat: ${stat.label}`);
        }
    }
}

async function seedExamplePosts() {
    console.log("Seeding example posts...");

    const posts = [
        // Twitter/X Posts
        {
            socialNetwork: SocialNetwork.TWITTER,
            content: `Traveling to [City]? 🗺️

Find Bitcoin-friendly restaurants, cafes, and shops before you go:
mappingbitcoin.com/[country]

Over X merchants accepting #Bitcoin in [Country] alone.`,
            hashtags: ["Bitcoin", "Travel", "SpendBitcoin"],
            notes: "Regional travel hook - customize for specific destinations"
        },
        {
            socialNetwork: SocialNetwork.TWITTER,
            content: `New merchant alert! 🎉

[Merchant Name] in [City, Country] now accepts Bitcoin.

Add it to your map → mappingbitcoin.com/map`,
            hashtags: ["BitcoinAccepted", "SpendBitcoin"],
            notes: "New merchant announcement template"
        },
        {
            socialNetwork: SocialNetwork.TWITTER,
            content: `The circular economy grows stronger every day.

This week: X new merchants added across Y countries.

Help us map them all → mappingbitcoin.com/places/create`,
            hashtags: ["Bitcoin", "CircularEconomy"],
            notes: "Weekly growth update - use real numbers"
        },
        {
            socialNetwork: SocialNetwork.TWITTER,
            content: `"Where can I spend Bitcoin near me?"

We get this question a lot.

The answer: mappingbitcoin.com

10,000+ merchants. 150+ countries. One map.`,
            hashtags: ["Bitcoin", "SpendBitcoin", "BitcoinPayments"],
            notes: "FAQ-style awareness post"
        },
        {
            socialNetwork: SocialNetwork.TWITTER,
            content: `Know a business that accepts Bitcoin but isn't on the map yet?

Add them in 60 seconds: mappingbitcoin.com/places/create

Community-powered. Always free.`,
            hashtags: ["Bitcoin", "OpenSource"],
            notes: "Call-to-action for community contributions"
        },

        // LinkedIn Posts
        {
            socialNetwork: SocialNetwork.LINKEDIN,
            content: `The Bitcoin economy is growing—and it's more diverse than you might think.

At Mapping Bitcoin, we track over 10,000 merchants across 150+ countries accepting Bitcoin payments. From coffee shops in Berlin to electronics stores in Tokyo, the infrastructure for everyday Bitcoin spending is quietly expanding.

Key observations from our data:
• Retail and food service lead adoption categories
• Emerging markets show fastest growth rates
• Verified merchants see 3x more customer engagement

For businesses considering Bitcoin acceptance: the network effects are real. Being discoverable to the global Bitcoin community creates genuine competitive advantage.

Explore the data: mappingbitcoin.com`,
            hashtags: ["Bitcoin", "Fintech", "Payments", "BusinessGrowth"],
            notes: "Professional/data-focused for business audience"
        },
        {
            socialNetwork: SocialNetwork.LINKEDIN,
            content: `Why are we building on Nostr?

At Mapping Bitcoin, we chose to build our review system on Nostr—an open, decentralized protocol—for the same reason we're mapping Bitcoin merchants: ownership matters.

When users leave reviews on Mapping Bitcoin:
✓ They own their data
✓ Reviews are portable across applications
✓ No central authority can censor or remove content
✓ The same identity works everywhere

This is what "building in public" actually means. Our entire codebase is open source. Our protocol is open. Our data is open.

Bitcoin taught us that open systems win. We're applying that lesson beyond just money.`,
            hashtags: ["Nostr", "OpenSource", "Web3", "Bitcoin", "BuildInPublic"],
            notes: "Technical philosophy for developer/builder audience"
        },

        // Nostr Posts
        {
            socialNetwork: SocialNetwork.NOSTR,
            content: `Spent sats at a new place today?

Leave a review on Mapping Bitcoin and help other plebs find good spots.

Your review lives on Nostr—you own it forever.

mappingbitcoin.com`,
            hashtags: ["Bitcoin", "Nostr", "Zaps"],
            notes: "Casual, community-focused Nostr post"
        },
        {
            socialNetwork: SocialNetwork.NOSTR,
            content: `Building the Bitcoin circular economy, one merchant at a time.

This week's additions:
- [X] new places in [Region A]
- [Y] new places in [Region B]
- [Z] verified merchants

Stack sats. Spend sats. Map sats.

nostr:npub... (tag relevant community members)`,
            hashtags: ["Bitcoin", "CircularEconomy", "Plebs"],
            notes: "Weekly update with Nostr-native features (tagging)"
        },
        {
            socialNetwork: SocialNetwork.NOSTR,
            content: `Anyone know a good place accepting Bitcoin in [City]?

Drop your recommendations below or check the map:
mappingbitcoin.com/[country]

Will zap the best suggestions ⚡`,
            hashtags: ["Bitcoin", "AskNostr"],
            notes: "Engagement post using zaps as incentive"
        },
        {
            socialNetwork: SocialNetwork.NOSTR,
            content: `GM, Bitcoin plebs! ☀️

Reminder that every time you spend Bitcoin at a local merchant, you're:

1. Proving Bitcoin works as money
2. Giving that merchant a reason to keep accepting
3. Building the future you want to see

Find a place to spend today: mappingbitcoin.com/map`,
            hashtags: ["GM", "Bitcoin", "SpendBitcoin"],
            notes: "Morning motivation post - Nostr culture"
        },

        // Instagram Posts
        {
            socialNetwork: SocialNetwork.INSTAGRAM,
            content: `📍 Bitcoin is accepted here.

Swipe to see some of the amazing merchants accepting Bitcoin around the world.

Found a place we're missing? Add it to the map - link in bio!

#Bitcoin #Travel #CryptoLife #SpendBitcoin #BitcoinAccepted`,
            hashtags: ["Bitcoin", "Travel", "CryptoLife", "SpendBitcoin", "BitcoinAccepted"],
            notes: "Carousel post template - pair with merchant photos"
        },
        {
            socialNetwork: SocialNetwork.INSTAGRAM,
            content: `From [City A] to [City B], Bitcoin is becoming local.

10,000+ merchants and growing. 150+ countries. One community.

Where have YOU spent Bitcoin recently? Tell us in the comments 👇

#Bitcoin #BitcoinCommunity #SpendBitcoin`,
            hashtags: ["Bitcoin", "BitcoinCommunity", "SpendBitcoin"],
            notes: "Community engagement post"
        },
    ];

    for (const post of posts) {
        // Check if a similar post exists (by content prefix to avoid exact match issues)
        const contentPrefix = post.content.substring(0, 50);
        const existing = await prisma.examplePost.findFirst({
            where: {
                socialNetwork: post.socialNetwork,
                content: { startsWith: contentPrefix }
            }
        });

        if (!existing) {
            await prisma.examplePost.create({ data: post });
            console.log(`  Created ${post.socialNetwork} post: "${contentPrefix}..."`);
        } else {
            console.log(`  Skipped (exists): ${post.socialNetwork} - "${contentPrefix}..."`);
        }
    }
}

async function main() {
    console.log("\n=== Marketing Content Seeder ===\n");

    try {
        await seedGuidelines();
        await seedLinks();
        await seedHashtags();
        await seedStats();
        await seedExamplePosts();

        console.log("\n✓ Marketing content seeded successfully!\n");
    } catch (error) {
        console.error("\n✗ Error seeding marketing content:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
