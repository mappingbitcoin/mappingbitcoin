import prisma from "../prisma";

export async function getOrCreateVenue(osmId: string) {
    return prisma.venue.upsert({
        where: { id: osmId },
        update: {},
        create: { id: osmId },
    });
}

export async function getVenueByOsmId(osmId: string) {
    return prisma.venue.findUnique({
        where: { id: osmId },
    });
}
