import { createHash } from "crypto";

/** Normalize + hash (name, unit) into a stable identity key. */
export function makeIdentityHash(name: string, unit: string) {
  const normalized = `${name.trim().toLowerCase()}::${unit.trim().toLowerCase()}`;
  return createHash("sha256").update(normalized).digest("hex");
}

export const VOTER_COOKIE = "mfmcf_voter_id";
