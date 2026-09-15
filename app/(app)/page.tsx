import { redirect } from "next/navigation";

import { title } from "@/components/primitives";
import { siteConfig } from "@/config/site";
import { getServerSession } from "@/lib/get-session";
import { canView, firstVisibleHref, parseRole } from "@/lib/permissions";

export default async function Home() {
  const session = await getServerSession();
  const role = parseRole(session?.user.role);

  if (!canView(role, "dashboard")) {
    const fallbackHref = firstVisibleHref(siteConfig.navItems, role);

    // A role that can't view the dashboard but can view something else (e.g. smallGroupLeader,
    // deacon) lands on its first visible section instead. Only a role with nothing visible at
    // all (pending, user) falls through to the message below.
    if (fallbackHref) {
      redirect(fallbackHref);
    }

    return (
      <section className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className={title()}>No access yet</h1>
        <p className="max-w-md text-muted">
          Your account doesn&apos;t have access to anything in Staff App yet. An
          admin or elder needs to assign you a role before you can continue.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center" />

      <div className="mt-8" />
    </section>
  );
}
