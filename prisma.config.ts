import "dotenv/config"; // loads .env
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local after .env so its values take precedence (matches Next.js behaviour).
// This is needed so `prisma migrate dev` picks up the Neon credentials pulled via `vercel env pull`.
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use the direct (unpooled) connection for migrations to avoid PgBouncer issues.
    // Falls back to DATABASE_URL when DATABASE_URL_UNPOOLED is not set.
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
