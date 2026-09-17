import type { AuthRole } from "@/lib/auth/roles";

export type { AuthRole };

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  emailVerified: boolean;
}

export interface AuthSessionData {
  id: string;
  userId: string;
  expiresAt: string;
}

export interface AuthSession {
  session: AuthSessionData;
  user: AuthSessionUser;
}

export interface AuthToken {
  token: string;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  role: AuthRole | null;
  banned: boolean | null;
  banReason: string | null;
  banExpires: string | null;
}

export interface AdminListUsersResponse {
  users: AdminUserListItem[];
  total: number;
}
