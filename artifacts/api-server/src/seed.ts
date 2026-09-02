import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./lib/logger.js";

export async function seedDefaultUsers() {
  try {
    const count = await db.select({ c: sql<number>`count(*)` }).from(usersTable);
    if (Number(count[0].c) > 0) return;

    const adminHash = await bcrypt.hash("Admin@2024", 10);
    const clerkHash = await bcrypt.hash("Clerk@2024", 10);

    await db.insert(usersTable).values([
      {
        username: "admin",
        passwordHash: adminHash,
        role: "admin",
        name: "System Administrator",
        email: "admin@dallascourts.gov",
      },
      {
        username: "clerk",
        passwordHash: clerkHash,
        role: "clerk",
        name: "Court Clerk",
        email: "clerk@dallascourts.gov",
      },
    ]);

    logger.info("Default users seeded: admin / Admin@2024 and clerk / Clerk@2024");
  } catch (err) {
    logger.error({ err }, "Error seeding default users");
  }
}
