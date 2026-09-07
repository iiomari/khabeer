import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    // Neon suspends idle compute, which silently kills any socket the pool is
    // still holding — the next query then fails with "Connection terminated
    // unexpectedly". Closing idle sockets well before that happens means the
    // pool always dials a fresh connection instead of reusing a dead one.
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 20_000,
    // The home page fans out about a dozen queries at once; a pool smaller than
    // that just queues them behind each other on an already distant database.
    max: 12,
  });

  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
