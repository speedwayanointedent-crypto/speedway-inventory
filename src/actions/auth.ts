"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendEmail, emailTemplates } from "@/lib/mail";
import { APP_CONFIG } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { newPasswordSchema } from "@/lib/validations";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(email: string) {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000);
  await User.findByIdAndUpdate(user._id, {
    resetToken: hashToken(token),
    resetTokenExpiry: expiry,
  });

  const resetUrl = `${APP_CONFIG.url}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    toName: user.name,
    subject: "Reset your password",
    html: emailTemplates.passwordReset(user.name, resetUrl),
  });

  await logActivity(
    { id: user._id.toString(), name: user.name, email: user.email },
    {
      action: "PASSWORD_RESET_REQUEST",
      module: "AUTH",
      description: `Password reset requested for ${user.email}`,
    }
  );

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const parsed = newPasswordSchema.safeParse({ token, password: newPassword, confirmPassword: newPassword });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }

  await connectDB();
  const user = await User.findOne({
    resetToken: hashToken(token),
    resetTokenExpiry: { $gt: new Date() },
  }).select("+resetToken +resetTokenExpiry");

  if (!user) return { success: false, error: "Invalid or expired token" };

  const hashed = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(user._id, {
    password: hashed,
    $unset: { resetToken: "", resetTokenExpiry: "" },
  });

  await logActivity(
    { id: user._id.toString(), name: user.name, email: user.email },
    {
      action: "PASSWORD_RESET",
      module: "AUTH",
      description: `Password reset completed for ${user.email}`,
    }
  );

  return { success: true };
}

export async function updateProfile(input: { name: string; phone: string }) {
  const { requireAuth } = await import("@/lib/session");
  const user = await requireAuth();
  if (!user.id) return { success: false, error: "Not authenticated" };
  if (!input.name || input.name.trim().length < 2) {
    return { success: false, error: "Name is required" };
  }
  await connectDB();
  await User.findByIdAndUpdate(user.id, {
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
  });
  await logActivity(user, {
    action: "UPDATE_PROFILE",
    module: "AUTH",
    description: `Updated own profile`,
  });
  return { success: true };
}
