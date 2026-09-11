export default async function ApplicationDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;

  return (
    <div>
      <h1>Application ID: {id}</h1>
    </div>
  );
}
