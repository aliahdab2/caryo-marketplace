"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { AuthProviderProps } from "@/types/components";

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      // Use very high refresh interval (24 hours) instead of 0
      refetchInterval={24 * 60 * 60} // 24 hours
      refetchOnWindowFocus={false} // Disable polling when window gains focus
      refetchWhenOffline={false} // Don't refetch when coming back online
    >
      {children}
    </SessionProvider>
  );
}
