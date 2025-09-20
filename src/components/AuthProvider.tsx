"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { getCurrentUser } from "@/lib/auth/actions";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const syncAuthState = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setUser({
            id: user.id,
            email: user.email,
            name: user.name || "Unknown User",
            image: user.image || undefined,
          });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Failed to sync auth state:", error);
        setUser(null);
      }
    };

    syncAuthState();
  }, [setUser]);

  return <>{children}</>;
}
