import CardSkeleton from "./card-skeleton";

type CardSkeletonListProps = {
  cardsLength: number;
};

export default function CardSkeletonList({
  cardsLength,
}: CardSkeletonListProps) {
  return (
    <>
      {Array.from({ length: cardsLength }).map((_, index) => (
        <CardSkeleton key={index} cardKey={`card-skeleton-${index}`} />
      ))}
    </>
  );
}
