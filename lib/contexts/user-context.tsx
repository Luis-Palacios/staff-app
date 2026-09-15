"use client";

import type { AuthSessionUser } from "@/api/auth-api/types";

import { createContext, useContext } from "react";

const UserContext = createContext<AuthSessionUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: AuthSessionUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): AuthSessionUser {
  const user = useContext(UserContext);

  if (!user) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }

  return user;
}
