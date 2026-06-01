import { connectDB } from "@/lib/db";
import { ActivityLog } from "@/models/ActivityLog";
import type { Session } from "next-auth";
import { safeJSON } from "@/lib/utils";
import { requireRole } from "@/lib/session";
import { ROLES } from "@/lib/constants";

export interface ActivityLogPayload {
  action: string;
  module: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  device?: string;
  userAgent?: string;
}

export async function logActivity(
  user: Session["user"] | { id?: string; name: string; email: string } | null,
  payload: ActivityLogPayload
) {
  try {
    await connectDB();
    await ActivityLog.create({
      user: user && "id" in user ? user.id : undefined,
      userName: user?.name ?? "System",
      userEmail: user?.email ?? "system@speedway.com",
      ...payload,
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
}

export async function getActivityLogs(opts?: {
  search?: string;
  module?: string;
  page?: number;
  limit?: number;
}) {
  await requireRole(ROLES.ADMIN);
  await connectDB();
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 25;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {};
  if (opts?.module && opts.module !== "all") filter.module = opts.module;
  if (opts?.search) {
    filter.$or = [
      { description: { $regex: opts.search, $options: "i" } },
      { userName: { $regex: opts.search, $options: "i" } },
      { userEmail: { $regex: opts.search, $options: "i" } },
      { action: { $regex: opts.search, $options: "i" } },
    ];
  }
  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);
  return {
    items: safeJSON<unknown[]>(items),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
