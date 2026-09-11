import { title } from "@/components/primitives";

export default async function ApplicationsPage() {
  const response = await fetch("http://localhost:8000/applications/recents");
  const data = await response.json();

  console.log(data);

  return (
    <div>
      <h1 className={title()}>Applications</h1>
    </div>
  );
}
