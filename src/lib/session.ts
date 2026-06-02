import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Permission, Role } from "@/lib/constants";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status === "SUSPENDED") redirect("/pending?reason=suspended");
  return user;
}

export async function requireRole(role: Role | Role[]) {
  const user = await requireAuth();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

export async function requirePermission(permission: Permission | Permission[]) {
  const user = await requireAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasPermission = permissions.some((p) => user.permissions.includes(p));
  if (!hasPermission) {
    redirect("/unauthorized");
  }
  return user;
}

export function hasPermission(
  userPermissions: Permission[],
  permission: Permission | Permission[]
): boolean {
  const permissions = Array.isArray(permission) ? permission : [permission];
  return permissions.some((p) => userPermissions.includes(p));
}
