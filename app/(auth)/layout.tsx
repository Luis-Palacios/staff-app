import { EkklesiaioMark } from "@/components/brand/ekklesiaio-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <EkklesiaioMark size={64} tone="auto" />
      {children}
    </div>
  );
}
