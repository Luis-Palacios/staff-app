import { Skeleton, Table } from "@heroui/react";

import { dataTable } from "@/components/data-table";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

// Same frame and spacing as a real data table, so the page doesn't jump when
// the data arrives. The first column mimics DataTablePrimaryCell.
export default function TableSkeleton({
  rows = 5,
  columns = 5,
}: TableSkeletonProps) {
  const { root, column, row, cell } = dataTable();

  return (
    <Table aria-label="Loading" className={root()} variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="Loading">
          <Table.Header>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Table.Column
                key={colIndex}
                className={column()}
                isRowHeader={colIndex === 0}
              >
                <Skeleton className="h-3 w-16 rounded" />
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <Table.Row key={rowIndex} className={row()}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Table.Cell key={colIndex} className={cell()}>
                    {colIndex === 0 ? (
                      <span className="flex items-center gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-full" />
                        <span className="flex w-full flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-32 rounded" />
                          <Skeleton className="h-3 w-20 rounded" />
                        </span>
                      </span>
                    ) : (
                      <Skeleton className="h-3.5 w-20 rounded" />
                    )}
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
