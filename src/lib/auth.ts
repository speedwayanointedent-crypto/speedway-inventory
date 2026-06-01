import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ROLE_PERMISSIONS, type Role, type Permission } from "@/lib/constants";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      permissions: Permission[];
      avatar?: string;
    };
  }
  interface User {
    id: string;
    role: Role;
    permissions: Permission[];
    avatar?: string;
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
    lastChecked?: number;
    remember?: boolean;
  }
}

const ROLE_RECHECK_MS = 5 * 60 * 1000;
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
          isActive: true,
        }).select("+password");

        if (!user) {
          throw new Error("Invalid credentials");
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
        token.isActive = true;
        token.lastChecked = Date.now();
        token.remember = user.remember ?? false;
        if (!user.remember) {
          const now = Math.floor(Date.now() / 1000);
          token.exp = now + SHORT_SESSION_SEC;
        }
        return token;
      }

      const now = Date.now();
      const lastChecked = token.lastChecked ?? 0;
      const stale = now - lastChecked > ROLE_RECHECK_MS;

      if (stale && token.id) {
        try {
          await connectDB();
          const fresh = await User.findById(token.id).select("role permissions isActive name avatar").lean();
          if (!fresh || !fresh.isActive) {
            return { ...token, isActive: false };
          }
          token.role = fresh.role as Role;
          token.permissions =
            fresh.permissions && fresh.permissions.length > 0
              ? (fresh.permissions as Permission[])
              : ROLE_PERMISSIONS[fresh.role as Role];
          token.name = fresh.name;
          token.avatar = fresh.avatar;
          token.isActive = true;
          token.lastChecked = now;
        } catch {
          token.lastChecked = now;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.isActive === false) {
        return null as unknown as typeof session;
      }
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.avatar = token.avatar;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
