import crypto from "crypto";

const ITERATIONS = 10000;
const KEY_LENGTH = 64;
const ALGORITHM = "sha512";

/**
 * Hash a password using Node's native pbkdf2Sync.
 * Returns a string formatted as "salt:hash".
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM)
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, combined: string): boolean {
  const parts = combined.split(":");
  if (parts.length !== 2) return false;
  const [salt, storedHash] = parts;
  const hash = crypto
    .pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, ALGORITHM)
    .toString("hex");

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}
