import type { CareLogKind } from "@/api/care-log-api/types";
import type { ComponentType, SVGProps } from "react";

import {
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  HomeIcon,
  PencilIcon,
  PhoneIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const ICONS: Record<CareLogKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  call: PhoneIcon,
  message: ChatBubbleOvalLeftEllipsisIcon,
  meeting: UsersIcon,
  visit: HomeIcon,
  heard: ChatBubbleBottomCenterTextIcon,
  note: PencilIcon,
};

/** The outline glyph of a care log kind (the boards' tiles and kind buttons). */
export function CareKindIcon({
  kind,
  className,
  strokeWidth = 1.7,
}: {
  kind: CareLogKind;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICONS[kind];

  return (
    <Icon aria-hidden="true" className={className} strokeWidth={strokeWidth} />
  );
}
