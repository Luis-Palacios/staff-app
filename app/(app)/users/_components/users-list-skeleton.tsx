import CardSkeletonList from "@/components/skeleton/card-skeleton-list";
import TableSkeleton from "@/components/skeleton/table-skeleton";

export default function UsersListSkeleton() {
  return (
    <>
      <div className="hidden md:block">
        <TableSkeleton columns={4} rows={10} />
      </div>
      <div className="grid gap-3 md:hidden">
        <CardSkeletonList cardsLength={3} />
      </div>
    </>
  );
}
