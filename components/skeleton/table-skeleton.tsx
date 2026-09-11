import { Table, Skeleton } from "@heroui/react";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};
export default function TableSkeleton({
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  return (
    <Table aria-label="Skeleton table" id="skeleton-table">
      <Table.ScrollContainer>
        <Table.Content aria-label="Skeleton table content">
          <Table.Header>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Table.Column key={colIndex}>
                <Skeleton className="h-4 w-full rounded" />
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <Table.Row key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Table.Cell key={colIndex}>
                    <Skeleton className="h-4 w-full rounded" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
