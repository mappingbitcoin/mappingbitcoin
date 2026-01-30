import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { serverEnv, isDevelopment, isProduction } from "@/lib/Environment";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    pool: Pool | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = serverEnv.databaseUrl;

    const pool = globalForPrisma.pool ?? new Pool({ connectionString });
    if (!globalForPrisma.pool) globalForPrisma.pool = pool;

    const adapter = new PrismaPg(pool);

    return new PrismaClient({
        adapter,
        log: isDevelopment ? ["query", "error", "warn"] : ["error"],
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction) globalForPrisma.prisma = prisma;

export default prisma;
