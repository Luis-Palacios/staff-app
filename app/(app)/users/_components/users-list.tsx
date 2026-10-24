import { headers } from "next/headers";

import UsersBrowser, { type LinkedMembers } from "./users-browser";

import { listUsers } from "@/api/auth-api/client";
import { listMembers } from "@/api/members-api/client";

export default async function UsersList() {
  const cookie = (await headers()).get("cookie") ?? "";
  const [{ users }, memberList] = await Promise.all([
    listUsers(cookie),
    listMembers("all"),
  ]);
  // One call for the whole list, matched on `userId`.
  const members: LinkedMembers = Object.fromEntries(
    memberList.flatMap(({ id, name, userId }) =>
      userId ? [[userId, { id, name }]] : [],
    ),
  );

  return <UsersBrowser members={members} users={users} />;
}
