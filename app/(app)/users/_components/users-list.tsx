import { headers } from "next/headers";

import UserCardSummary from "./user-card-summary";
import UsersSummaryTable from "./users-summary-table";

import { listUsers } from "@/api/auth-api/client";

export default async function UsersList() {
  const cookie = (await headers()).get("cookie") ?? "";
  const { users } = await listUsers(cookie);

  return (
    <>
      <div className="hidden md:block">
        <UsersSummaryTable data={users} />
      </div>

      <div className="grid gap-3 md:hidden">
        {users.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No users yet.</p>
        ) : (
          users.map((user) => <UserCardSummary key={user.id} user={user} />)
        )}
      </div>
    </>
  );
}
