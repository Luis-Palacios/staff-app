import CardSkeletonList from "@/components/skeleton/card-skeleton-list";
import TableSkeleton from "@/components/skeleton/table-skeleton";

export default function MembershipApplicationsListSkeleton() {
  return (
    <>
      <div className="hidden md:inline-block text-center justify-center">
        <TableSkeleton columns={8} rows={10} />
      </div>
      <div className="grid gap-3 md:hidden">
        <CardSkeletonList cardsLength={3} />
      </div>
    </>
  );
}
