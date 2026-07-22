/**
 * Run once to create the very first superadmin account:
 *   npm run bootstrap:superadmin -- --name "Jane Doe" --email jane@example.com --password "at-least-8-chars"
 *
 * After this, sign in at /admin/login and invite further admins from
 * /admin/manage — you shouldn't need this script again.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/crypto";

// Inline .env file loader for environments where process.env is not populated by the shell
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadEnv();

  const name = arg("--name");
  const email = arg("--email");
  const password = arg("--password");

  if (!name || !email || !password) {
    console.error(
      'Usage: npm run bootstrap:superadmin -- --name "Jane Doe" --email jane@example.com --password "secret123"'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Set DATABASE_URL in your environment or .env file first.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.error(`An administrator with the email ${email} already exists.`);
      process.exit(1);
    }

    const passwordHash = hashPassword(password);

    const admin = await prisma.admin.create({
      data: {
        fullName: name,
        email,
        passwordHash,
        role: "superadmin",
      },
    });

    console.log(`Superadmin created in database: ${admin.email} (${admin.id})`);
  } catch (err: any) {
    console.error("Failed to create superadmin:", err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
