import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  // DATABASE_URL is passed via process.env at runtime.
  // The adapter is configured in lib/prisma.ts (PrismaPg).
});
