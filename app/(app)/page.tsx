import { Card } from "@heroui/react/card";
import { Link } from "@heroui/react";

import { getRecentApplicationsCount } from "@/api/applications-membership-api/client";

export default async function Home() {
  const recentApplicationsCount = await getRecentApplicationsCount();

  return (
    <section className="gap-4 py-2 md:py-2 grid grid-cols-1 md:grid-cols-4">
      <Card className="col-span-1" variant="secondary">
        <Card.Header>
          <Card.Title className="mb-4">Recent Applications</Card.Title>
          <Card.Description className="mb-4 !text-warning text-3xl">
            {recentApplicationsCount}
          </Card.Description>
        </Card.Header>
        <Card.Footer>
          <Link className="text-accent decoration-accent" href="/applications">
            View All
            <Link.Icon />
          </Link>
        </Card.Footer>
      </Card>
    </section>
  );
}
