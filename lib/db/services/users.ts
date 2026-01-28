import prisma from "../prisma";

interface UserProfile {
    name?: string | null;
    picture?: string | null;
    nip05?: string | null;
}

export async function getOrCreateUser(pubkey: string, profileData?: UserProfile) {
    const now = new Date();

    return prisma.user.upsert({
        where: { pubkey },
        update: profileData
            ? {
                  name: profileData.name,
                  picture: profileData.picture,
                  nip05: profileData.nip05,
                  profileUpdatedAt: now,
              }
            : {},
        create: {
            pubkey,
            name: profileData?.name,
            picture: profileData?.picture,
            nip05: profileData?.nip05,
            profileUpdatedAt: profileData ? now : null,
        },
    });
}

export async function updateUserProfile(pubkey: string, profile: UserProfile) {
    return prisma.user.update({
        where: { pubkey },
        data: {
            name: profile.name,
            picture: profile.picture,
            nip05: profile.nip05,
            profileUpdatedAt: new Date(),
        },
    });
}

export async function getUserByPubkey(pubkey: string) {
    return prisma.user.findUnique({
        where: { pubkey },
    });
}
