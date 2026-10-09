import { StatusBadge } from "@/components/status-badge";

export function ApplicationStatusBadge({
  isFulfilled,
}: {
  isFulfilled: boolean;
}) {
  return isFulfilled ? (
    <StatusBadge tone="success">Fulfilled</StatusBadge>
  ) : (
    <StatusBadge tone="warning" variant="ring-dot">
      Pending
    </StatusBadge>
  );
}
