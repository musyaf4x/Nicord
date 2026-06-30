import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    // Falls back to a mock URL during Docker build time when env variables are not present.
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
