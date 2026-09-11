import { DocumentTextIcon, HomeIcon } from "@heroicons/react/24/solid";
import { Breadcrumbs } from "@heroui/react/breadcrumbs";

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumbs className="mb-3">
        <Breadcrumbs.Item className="flex items-center gap-1.5" href="/">
          <HomeIcon className="h-4 w-4 mr-2" />
          <span>Home</span>
        </Breadcrumbs.Item>
        <Breadcrumbs.Item
          className="flex items-center gap-1.5"
          href="/applications"
        >
          <DocumentTextIcon className="h-4 w-4 mr-1" />
          <span>Applications</span>
        </Breadcrumbs.Item>
      </Breadcrumbs>
      <h2 className="mb-3 font-bold ml-2">Membership Applications</h2>
      <section className="flex flex-col gap-4">
        <div className="inline-block text-center justify-center">
          {children}
        </div>
      </section>
    </>
  );
}
