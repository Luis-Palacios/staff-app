"use client";

import type { AuthSessionUser } from "@/api/auth-api/types";
import type { MeFeatures } from "@/api/members-api/types";
import type { Permissions } from "@/lib/auth/permissions";

import { createContext, useContext } from "react";

interface CurrentUser {
  user: AuthSessionUser;
  permissions: Permissions;
  features: MeFeatures;
}

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({
  user,
  permissions,
  features,
  children,
}: CurrentUser & {
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ user, permissions, features }}>
      {children}
    </UserContext.Provider>
  );
}

function useUserContext(): CurrentUser {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }

  return context;
}

export function useCurrentUser(): AuthSessionUser {
  return useUserContext().user;
}

/** The signed-in user's permissions, to hide what they can't use. The API still guards it. */
export function usePermissions(): Permissions {
  return useUserContext().permissions;
}

/** The church's settings (`/me` features), to hide controls for a feature that is off. */
export function useFeatures(): MeFeatures {
  return useUserContext().features;
}
