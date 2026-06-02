import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ROLE_PERMISSIONS, USER_STATUS, type Role, type Permission } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      permissions: Permission[];
      avatar?: string;
      status?: string;
    };
  }
  interface User {
    id: string;
    role: Role;
    permissions: Permission[];
    avatar?: string;
    status?: string;
    remember?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissions: Permission[];
    avatar?: string;
    isActive?: boolean;
    status?: string;
    remember?: boolean;
  }
}

const SHORT_SESSION_SEC = 24 * 60 * 60;
const LONG_SESSION_SEC = 30 * 24 * 60 * 60;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        }).select("+password");

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (user.status === USER_STATUS.PENDING) {
          throw new Error("PENDING_APPROVAL");
        }

        if (user.status === USER_STATUS.SUSPENDED || !user.isActive) {
          throw new Error("ACCOUNT_DISABLED");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

        const permissions =
          user.permissions && user.permissions.length > 0
            ? user.permissions
            : ROLE_PERMISSIONS[user.role as Role];

        const rememberRaw = (credentials as Record<string, unknown>).remember;
        const remember =
          rememberRaw === true ||
          rememberRaw === "true" ||
          rememberRaw === "on" ||
          rememberRaw === "1";

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions,
          avatar: user.avatar,
          status: user.status,
          remember,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: LONG_SESSION_SEC,
    updateAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: LONG_SESSION_SEC,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.avatar = user.avatar;
        token.status = user.status;
        token.isActive = true;
        token.remember = user.remember ?? false;
        if (!user.remember) {
          const now = Math.floor(Date.now() / 1000);
          token.exp = now + SHORT_SESSION_SEC;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token?.id) return null as unknown as typeof session;

      if (token.isActive === false || token.status === "PENDING" || token.status === "SUSPENDED") {
        return null as unknown as typeof session;
      }

      session.user.id = token.id;
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      session.user.avatar = token.avatar;
      session.user.status = token.status;
      session.user.name = (token.name as string) ?? session.user.name;
      session.user.email = (token.email as string) ?? session.user.email;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
