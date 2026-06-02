"use server";

import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { signupSchema, type SignupInput } from "@/lib/validations";
import { ROLE_PERMISSIONS, ROLES, USER_STATUS, APP_CONFIG } from "@/lib/constants";
import { logActivity } from "@/lib/activity";
import { sendEmail, emailTemplates } from "@/lib/mail";

export async function signup(input: SignupInput) {
  const data = signupSchema.parse(input);

  await connectDB();

  const existing = await User.findOne({ email: data.email.toLowerCase() }).select("_id").lean();
  if (existing) {
    return { success: false, error: "An account with that email already exists" };
  }

  const hashed = await bcrypt.hash(data.password, 12);

  let user;
  try {
    user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      password: hashed,
      role: ROLES.STAFF,
      status: USER_STATUS.PENDING,
      permissions: [],
      isActive: false,
    });
  } catch (err: unknown) {
    const e = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (e?.code === 11000 && e?.keyPattern?.email) {
      return { success: false, error: "An account with that email already exists" };
    }
    throw err;
  }

  await logActivity(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    {
      action: "SIGNUP",
      module: "AUTH",
      description: `New account awaiting admin approval: ${user.email}`,
    }
  );

  try {
    await sendEmail({
      to: user.email,
      toName: user.name,
      subject: `Welcome to ${APP_CONFIG.name} — pending approval`,
      html: emailTemplates.pendingApproval(user.name),
    });
  } catch {
    // welcome email is best-effort
  }

  return { success: true, email: user.email };
}
