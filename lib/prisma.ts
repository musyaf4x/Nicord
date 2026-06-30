import { PrismaClient } from ".prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn(
      "\n[Nicord] ⚠️  DATABASE_URL is not set.\n" +
      "DB operations will throw. Set DATABASE_URL in .env.local.\n"
    );
    // Still create a real client — it will fail only when queries are made
    // Use a dummy URL so constructor doesn't throw
    const adapter = new PrismaPg({
      connectionString: "postgresql://localhost:5432/placeholder",
    });
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
