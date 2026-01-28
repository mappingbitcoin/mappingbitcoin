import prisma from "../prisma";

function generateUnsubscribeToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

export async function getOrCreateSubscriptionList(slug: string, name?: string, description?: string) {
    return prisma.subscriptionList.upsert({
        where: { slug },
        update: {},
        create: {
            slug,
            name: name ?? slug.charAt(0).toUpperCase() + slug.slice(1),
            description,
        },
    });
}

export async function subscribeEmail(email: string, listSlug: string = "newsletter") {
    const normalizedEmail = email.toLowerCase().trim();

    return prisma.$transaction(async (tx) => {
        const list = await tx.subscriptionList.upsert({
            where: { slug: listSlug },
            update: {},
            create: {
                slug: listSlug,
                name: listSlug === "newsletter" ? "Newsletter" : listSlug.charAt(0).toUpperCase() + listSlug.slice(1),
            },
        });

        let subscriber = await tx.subscriber.findUnique({
            where: { email: normalizedEmail },
            include: { lists: { include: { list: true } } },
        });

        if (!subscriber) {
            subscriber = await tx.subscriber.create({
                data: {
                    email: normalizedEmail,
                    unsubscribeToken: generateUnsubscribeToken(),
                    confirmedAt: new Date(),
                },
                include: { lists: { include: { list: true } } },
            });
        }

        const existingSubscription = await tx.subscriberList.findUnique({
            where: {
                subscriberId_listId: {
                    subscriberId: subscriber.id,
                    listId: list.id,
                },
            },
        });

        if (existingSubscription && !existingSubscription.unsubscribedAt) {
            return { subscriber, isNew: false };
        }

        await tx.subscriberList.upsert({
            where: {
                subscriberId_listId: {
                    subscriberId: subscriber.id,
                    listId: list.id,
                },
            },
            update: {
                unsubscribedAt: null,
                subscribedAt: new Date(),
            },
            create: {
                subscriberId: subscriber.id,
                listId: list.id,
            },
        });

        const updatedSubscriber = await tx.subscriber.findUnique({
            where: { id: subscriber.id },
            include: { lists: { include: { list: true } } },
        });

        return { subscriber: updatedSubscriber!, isNew: !existingSubscription };
    });
}

export async function getSubscriberByToken(token: string) {
    return prisma.subscriber.findUnique({
        where: { unsubscribeToken: token },
        include: {
            lists: {
                where: { unsubscribedAt: null },
                include: { list: true },
            },
        },
    });
}

export async function unsubscribeByToken(token: string, listSlug?: string) {
    const subscriber = await prisma.subscriber.findUnique({
        where: { unsubscribeToken: token },
        include: { lists: { include: { list: true } } },
    });

    if (!subscriber) {
        return null;
    }

    const now = new Date();

    if (listSlug) {
        const list = await prisma.subscriptionList.findUnique({
            where: { slug: listSlug },
        });

        if (!list) {
            return null;
        }

        await prisma.subscriberList.updateMany({
            where: {
                subscriberId: subscriber.id,
                listId: list.id,
                unsubscribedAt: null,
            },
            data: { unsubscribedAt: now },
        });
    } else {
        await prisma.subscriberList.updateMany({
            where: {
                subscriberId: subscriber.id,
                unsubscribedAt: null,
            },
            data: { unsubscribedAt: now },
        });
    }

    return prisma.subscriber.findUnique({
        where: { id: subscriber.id },
        include: {
            lists: { include: { list: true } },
        },
    });
}

export async function getActiveSubscribers(listSlug: string) {
    const list = await prisma.subscriptionList.findUnique({
        where: { slug: listSlug },
        include: {
            subscribers: {
                where: { unsubscribedAt: null },
                include: { subscriber: true },
            },
        },
    });

    return list?.subscribers.map((s) => s.subscriber) ?? [];
}
