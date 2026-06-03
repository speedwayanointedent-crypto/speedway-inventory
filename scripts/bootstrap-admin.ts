/* eslint-disable @typescript-eslint/no-require-imports */
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../src/lib/db";
import { User } from "../src/models";
import { ROLE_PERMISSIONS, USER_STATUS } from "../src/lib/constants";

const EMAIL = "admin@speedway.com";
const PASSWORD = "Admin@123456";

async function main() {
  await connectDB();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const result = await User.findOneAndUpdate(
    { email: EMAIL.toLowerCase() },
    {
      $set: {
        name: "Admin User",
        email: EMAIL.toLowerCase(),
        password: passwordHash,
        role: "ADMIN",
        status: USER_STATUS.ACTIVE,
        isActive: true,
        permissions: ROLE_PERMISSIONS.ADMIN,
        approvedAt: new Date(),
      },
      $unset: { resetToken: "", resetTokenExpiry: "" },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log("Admin user ready:");
  console.log("  id:    ", result._id.toString());
  console.log("  email: ", result.email);
  console.log("  role:  ", result.role);
  console.log("  status:", result.status);
  console.log("  isActive:", result.isActive);
  console.log("");
  console.log("Login with:");
  console.log("  Email:    admin@speedway.com");
  console.log("  Password: Admin@123456");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
