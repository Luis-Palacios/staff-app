import { headers } from "next/headers";

import UserCardSummary from "./user-card-summary";
import UsersSummaryTable from "./users-summary-table";

import { listUsers } from "@/api/auth-api/client";

export default async function UsersList() {
  const cookie = (await headers()).get("cookie") ?? "";
  const { users } = await listUsers(cookie);

  return (
    <>
      <div className="hidden md:inline-block text-center justify-center">
        <UsersSummaryTable data={users} />
      </div>

      <div className="grid gap-3 md:hidden">
        {users.map((user) => (
          <UserCardSummary key={user.id} user={user} />
        ))}
      </div>
    </>
  );
}
