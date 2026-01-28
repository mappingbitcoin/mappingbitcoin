import prisma from "../prisma";

export async function getOrCreateVenue(osmId: string) {
    return prisma.venue.upsert({
        where: { osmId },
        update: {},
        create: { osmId },
    });
}

export async function getVenueByOsmId(osmId: string) {
    return prisma.venue.findUnique({
        where: { osmId },
    });
}
