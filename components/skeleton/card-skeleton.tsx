import { Skeleton } from "@heroui/react/skeleton";
import { Card } from "@heroui/react/card";

type CardSkeletonProps = {
  cardKey: string | number;
};

export default function CardSkeleton({ cardKey: key }: CardSkeletonProps) {
  return (
    <Card.Root key={key}>
      <Card.Header>
        <Card.Title>
          <Skeleton className="h-6 w-full" />
        </Card.Title>
        <Card.Description>
          <span className="skeleton skeleton--pulse inline-block h-4 w-full" />
        </Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-1 text-sm">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full mt-2" />
        <Skeleton className="h-6 w-full mt-2" />
      </Card.Content>
      <Card.Footer>
        <Skeleton className="h-6 w-full" />
      </Card.Footer>
    </Card.Root>
  );
}
