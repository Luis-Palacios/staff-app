import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Accordion } from "@heroui/react/accordion";

import { DetailCardHeading } from "./detail-card-heading";

import { card } from "@/components/primitives";

// HeroUI draws the trigger's focus ring outside the element, where the
// card's overflow-hidden would clip it at the sides, so it's inset here.
const trigger = [
  "gap-3 px-[26px] pb-2.5 pt-[18px] text-base font-semibold text-heading",
  "data-[focus-visible=true]:ring-inset",
].join(" ");

// Body text is indented to line up with the section title (26px padding +
// 26px number + 12px gap). pre-line keeps the paragraph breaks people type.
const body = [
  "max-w-[66ch] pb-[22px] pl-16 pr-[26px] text-foreground",
  "whitespace-pre-line font-display text-[17.5px] leading-[1.65]",
].join(" ");

const sections = [
  { id: "life-before", label: "Life before" },
  { id: "conversion", label: "Conversion" },
  { id: "life-after", label: "Life after" },
] as const;

// The three testimony sections, all open to start with. The API doesn't say
// which language a testimony is in, so the body has no `lang` attribute.
export function TestimonyCard({
  lifeBefore,
  conversion,
  lifeAfter,
}: {
  lifeBefore: string;
  conversion: string;
  lifeAfter: string;
}) {
  const text = {
    "life-before": lifeBefore,
    conversion,
    "life-after": lifeAfter,
  };

  return (
    <section
      className={card({
        className: "min-w-0 flex-[3_1_520px] overflow-hidden",
      })}
    >
      <div className="px-[26px] pb-1.5 pt-5">
        <DetailCardHeading eyebrow="Testimony">
          In their own words
        </DetailCardHeading>
      </div>
      <Accordion
        allowsMultipleExpanded
        defaultExpandedKeys={sections.map(({ id }) => id)}
      >
        {sections.map(({ id, label }, index) => (
          <Accordion.Item key={id} id={id}>
            <Accordion.Heading>
              <Accordion.Trigger className={trigger}>
                <span
                  aria-hidden="true"
                  className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-accent-soft text-[12.5px] font-bold text-accent-soft-foreground"
                >
                  {index + 1}
                </span>
                <span className="flex-1">{label}</span>
                <Accordion.Indicator>
                  <ChevronDownIcon strokeWidth={2} />
                </Accordion.Indicator>
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className={body}>{text[id]}</Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </section>
  );
}
