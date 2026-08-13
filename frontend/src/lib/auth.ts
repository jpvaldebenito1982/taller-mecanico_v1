import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

type AuthorizedUser = {
  id: string;
  role: string;
  access_token: string;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return false;

      const backendUrl =
        process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL;
      const sharedSecret = process.env.AUTH_SHARED_SECRET;

      if (!backendUrl || !sharedSecret) {
        console.error("Google allow-list validation is not configured.");
        return false;
      }

      try {
        const response = await fetch(
          `${backendUrl}/api/users/auth-check?email=${encodeURIComponent(user.email)}`,
          {
            headers: { "X-Auth-Secret": sharedSecret },
            cache: "no-store",
          }
        );

        if (!response.ok) return false;

        const authorizedUser = (await response.json()) as AuthorizedUser;
        user.id = authorizedUser.id;
        (user as typeof user & { role: string }).role = authorizedUser.role;
        (user as typeof user & { accessToken: string }).accessToken =
          authorizedUser.access_token;
        return true;
      } catch (error) {
        console.error("Could not validate the Google user.", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as typeof user & { role?: string }).role;
        token.accessToken = (
          user as typeof user & { accessToken?: string }
        ).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: string;
        };
        sessionUser.id = token.userId as string;
        sessionUser.role = token.role as string;
        (
          session as typeof session & { accessToken?: string }
        ).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
};
