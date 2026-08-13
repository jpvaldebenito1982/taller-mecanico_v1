"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, type ReactNode } from "react";

function AuthenticatedApiFetch({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const accessToken = (
    session as typeof session & { accessToken?: string }
  )?.accessToken;

  useEffect(() => {
    if (status === "authenticated" && !accessToken) {
      void signOut({ callbackUrl: "/login" });
    }
  }, [accessToken, status]);

  useLayoutEffect(() => {
    if (!accessToken) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      if (!requestUrl.startsWith(apiUrl)) {
        return originalFetch(input, init);
      }

      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined)
      );
      headers.set("Authorization", `Bearer ${accessToken}`);

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [accessToken]);

  if (pathname.startsWith("/dashboard") && (status === "loading" || !accessToken)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Validando acceso...
      </div>
    );
  }

  return children;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthenticatedApiFetch>{children}</AuthenticatedApiFetch>
    </SessionProvider>
  );
}
