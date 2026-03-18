"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
// Si tienes shadcn:
// import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  const handleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-semibold">Ingresar al sistema</h1>
        <p className="text-gray-500 text-sm">
          Autentícate con tu cuenta de Google para acceder al panel del taller.
        </p>

        {/* Usa Button si lo tienes */}
        <button
          onClick={handleLogin}
          className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Continuar con Google
        </button>
      </div>
    </div>
  );
}
