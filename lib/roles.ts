export type AdminRole = "admin" | "superadmin";

type MinimalUser = { role?: string | null } | null | undefined;

export function getRole(user: MinimalUser): AdminRole | null {
  const role = user?.role;
  return role === "superadmin" || role === "admin" ? role : null;
}

export function isSuperAdmin(user: MinimalUser): boolean {
  return getRole(user) === "superadmin";
}
