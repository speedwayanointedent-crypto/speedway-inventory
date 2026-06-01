"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, Settings, Category } from "@/models";
import { requireRole, requireAuth } from "@/lib/session";
import { userSchema, userUpdateSchema, settingsUpdateSchema, type UserInput, type SettingsInput } from "@/lib/validations";
import { ROLES, ROLE_PERMISSIONS } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { sendEmail, emailTemplates } from "@/lib/mail";
import { safeJSON } from "@/lib/utils";

export async function createUser(input: UserInput) {
  const admin = await requireRole(ROLES.ADMIN);
  const data = userSchema.parse(input);
  if (!data.password) return { success: false, error: "Password is required" };

  await connectDB();
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) return { success: false, error: "Email already exists" };

  const hashed = await bcrypt.hash(data.password, 12);
  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashed,
    role: data.role,
    phone: data.phone,
    permissions: data.permissions ?? ROLE_PERMISSIONS[data.role],
    isActive: data.isActive,
  });

  await sendEmail({
    to: data.email,
    toName: data.name,
    subject: "Welcome to SpeedWay Anointed Enterprise",
    html: emailTemplates.welcome(data.name, data.email, undefined),
  });

  await logActivity(admin, {
    action: "CREATE_USER",
    module: "USERS",
    description: `Created user ${user.email} (${user.role})`,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateUser(id: string, input: Partial<UserInput>) {
  const admin = await requireRole(ROLES.ADMIN);
  const data = userUpdateSchema.parse(input);
  await connectDB();
  const update: Record<string, unknown> = { ...data };
  if (data.password) update.password = await bcrypt.hash(data.password, 12);
  else delete update.password;
  await User.findByIdAndUpdate(id, update);
  await logActivity(admin, {
    action: "UPDATE_USER",
    module: "USERS",
    description: `Updated user ${id}`,
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(id: string) {
  const admin = await requireRole(ROLES.ADMIN);
  if (admin.id === id) return { success: false, error: "You cannot delete yourself" };
  await connectDB();
  await User.findByIdAndUpdate(id, { isActive: false });
  await logActivity(admin, {
    action: "DELETE_USER",
    module: "USERS",
    description: `Deactivated user ${id}`,
  });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function getUsers() {
  await requireRole(ROLES.ADMIN);
  await connectDB();
  const items = await User.find().sort({ createdAt: -1 }).lean();
  return safeJSON<unknown[]>(items);
}

export async function getSettings() {
  await requireAuth();
  await connectDB();
  let settings = await Settings.findOne().lean();
  if (!settings) {
    const created = await Settings.create({});
    settings = JSON.parse(JSON.stringify(created.toObject()));
  }
  return safeJSON<unknown>(settings);
}

export async function updateSettings(input: SettingsInput) {
  const admin = await requireRole(ROLES.ADMIN);
  const data = settingsUpdateSchema.parse(input);
  await connectDB();
  await Settings.findOneAndUpdate({}, data, { upsert: true });
  await logActivity(admin, {
    action: "UPDATE_SETTINGS",
    module: "SETTINGS",
    description: "Updated system settings",
  });
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function getCategories() {
  await requireAuth();
  await connectDB();
  const items = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  return safeJSON<unknown[]>(items);
}
