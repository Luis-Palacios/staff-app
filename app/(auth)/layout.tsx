import { EkklesiaioLogo } from "@/components/brand/ekklesiaio-logo";
import { siteConfig } from "@/config/site";

// Two panels: the navy brand panel (the same in both modes) and the form.
// Below md the brand panel collapses to a bar with just the logo. Each page
// renders an AuthHeading plus its form or actions, with no Card around them.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside
        className={[
          "flex shrink-0 flex-col border-b border-rail-edge bg-navy-900 px-6 py-4 text-on-dark",
          "md:flex-[1_1_420px] md:gap-10 md:border-b-0 md:border-r md:px-12 md:py-10",
          // Gold focus halo on navy, as on the sidebar rail.
          "[--focus:var(--color-gold-500)] [--shadow-focus:0_0_0_2px_var(--color-navy-900),0_0_0_4px_var(--color-gold-500)]",
        ].join(" ")}
      >
        <EkklesiaioLogo size={24} tone="on-dark" />
        <div className="hidden max-w-[460px] flex-1 flex-col justify-center gap-[18px] md:flex">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-gold-500">
            Staff workspace
          </p>
          <p className="font-display text-[44px] font-medium leading-[1.08] tracking-[-0.015em] text-white">
            Know your people.{" "}
            <em className="font-normal text-gold-300">Care for them well.</em>
          </p>
          <p className="text-[17px] leading-[1.6]">
            Membership applications, groups and the people behind them, all in
            one place for your church&apos;s staff.
          </p>
        </div>
        <p className="hidden text-[13px] text-muted-on-dark md:block">
          © {new Date().getFullYear()} {siteConfig.name} ·{" "}
          <a className="text-on-dark underline" href={siteConfig.links.privacy}>
            Privacy
          </a>
        </p>
      </aside>
      <main className="flex flex-[1_1_520px] items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
