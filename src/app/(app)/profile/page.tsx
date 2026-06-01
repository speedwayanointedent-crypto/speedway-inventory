import type { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { requireAuth } from "@/lib/session";
import { ProfileClient } from "@/components/profile/profile-client";
import { updateProfile } from "@/actions/auth";
import { safeJSON } from "@/lib/utils";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const session = await requireAuth();
  await connectDB();
  const userDoc = await User.findById(session.id).lean();
  if (!userDoc) throw new Error("User not found");
  const user = safeJSON<{
    name: string;
    email: string;
    phone?: string;
    role: "ADMIN" | "STAFF";
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
  }>(userDoc);

  return <ProfileClient user={user} onUpdate={updateProfile} />;
}
