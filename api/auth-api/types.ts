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

// Only the 4 real, persisted statuses (see auth-server's invite table). "expired" is a virtual
// state better-invite's own /invite/list computes at read time (expiresAt < now), never written
// back to the row - our custom /api/custom-auth/invites route returns the raw column, so the UI
// derives "expired" itself from status === "pending" && expiresAt in the past (Step 8).
export type InviteStatus = "pending" | "rejected" | "canceled" | "used";

export interface AdminInviteListItem {
  id: string;
  // Needed to call authClient.invite.cancel({ token }) - better-invite keys cancellation by
  // token, not id (see auth-server's cancel-invite.ts).
  token: string | null;
  email: string | null;
  emails: string[] | null;
  role: AuthRole;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string | null;
  createdByUserId: string | null;
  inviterName: string | null;
  inviterEmail: string | null;
}

export interface AdminListInvitesResponse {
  invites: AdminInviteListItem[];
}
