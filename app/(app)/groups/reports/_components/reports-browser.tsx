"use client";

import type { ReportList, ReportListItem } from "@/api/small-groups-api/types";
import type { ReportFilters } from "@/app/(app)/groups/reports/_lib/report-filters";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { parseDate } from "@internationalized/date";
import {
  Button,
  DateField,
  DateRangePicker,
  InputGroup,
  Label,
  ListBox,
  Modal,
  RangeCalendar,
  Select,
  TextField,
} from "@heroui/react";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import ReportCard from "./report-card";
import ReportsTable from "./reports-table";

import { listReportsPageAction } from "@/app/(app)/groups/reports/_actions/report-actions";
import {
  hasActiveFilters,
  REPORT_PAGE_SIZE,
} from "@/app/(app)/groups/reports/_lib/report-filters";
import { StatusTabs } from "@/components/status-tabs";

interface GroupOption {
  id: number;
  name: string;
  closed: boolean;
}

const ALL_GROUPS = "all";

function GroupFilter({
  groups,
  value,
  scoped,
  onChange,
}: {
  groups: GroupOption[];
  value: number | null;
  scoped: boolean;
  onChange: (groupId: number | null) => void;
}) {
  const t = useTranslations("ReportsList");

  return (
    <Select.Root
      className="w-full gap-1.5 md:w-[300px]"
      selectedKey={value === null ? ALL_GROUPS : String(value)}
      onSelectionChange={(key) =>
        onChange(key === ALL_GROUPS || key === null ? null : Number(key))
      }
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("group")}
      </Label>
      <Select.Trigger className="h-10 min-h-10 items-center rounded-control py-0">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          <ListBox.Item id={ALL_GROUPS} textValue={t("allGroups")}>
            {scoped ? t("allMyGroups") : t("allGroups")}
            <ListBox.ItemIndicator />
          </ListBox.Item>
          {groups.map((group) => {
            const label = group.closed
              ? t("closedOption", { name: group.name })
              : group.name;

            return (
              <ListBox.Item
                key={group.id}
                id={String(group.id)}
                textValue={label}
              >
                {label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            );
          })}
        </ListBox>
      </Select.Popover>
    </Select.Root>
  );
}

function DatesFilter({
  from,
  to,
  max,
  onChange,
}: {
  from: string;
  to: string;
  /** Today: there are no reports to look for after it. */
  max: string;
  onChange: (from: string, to: string) => void;
}) {
  const t = useTranslations("ReportsList");

  return (
    <DateRangePicker
      className="w-full gap-1.5 md:w-[290px]"
      maxValue={parseDate(max)}
      value={{ start: parseDate(from), end: parseDate(to) }}
      onChange={(range) => {
        if (range) onChange(range.start.toString(), range.end.toString());
      }}
    >
      <Label className="text-[13px] font-semibold text-heading">
        {t("dates")}
      </Label>
      <DateField.Group fullWidth className="h-10">
        <DateField.Input slot="start">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DateRangePicker.Trigger>
            <DateRangePicker.TriggerIndicator />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label={t("dates")} maxValue={parseDate(max)}>
          <RangeCalendar.Header>
            <RangeCalendar.YearPickerTrigger>
              <RangeCalendar.YearPickerTriggerHeading />
              <RangeCalendar.YearPickerTriggerIndicator />
            </RangeCalendar.YearPickerTrigger>
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => (
                <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
              )}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
          <RangeCalendar.YearPickerGrid>
            <RangeCalendar.YearPickerGridBody>
              {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
            </RangeCalendar.YearPickerGridBody>
          </RangeCalendar.YearPickerGrid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}

// Phone cards: the first page comes from the server; "Show more" asks for the next one and adds it.
// Keyed by the filters in the parent, so a filter change starts over.
function ReportCards({
  data,
  filters,
  defaults,
  canSubmit,
  leaders,
}: {
  data: ReportList;
  filters: ReportFilters;
  defaults: { from: string; to: string };
  canSubmit: boolean;
  leaders: Record<number, string>;
}) {
  const t = useTranslations("ReportsList");
  const [extra, setExtra] = useState<ReportListItem[]>([]);
  const [nextPage, setNextPage] = useState(data.page + 1);
  const [isPending, startTransition] = useTransition();
  const shown =
    (data.page - 1) * data.pageSize + data.items.length + extra.length;
  const items = [...data.items, ...extra];

  function showMore() {
    startTransition(async () => {
      const result = await listReportsPageAction({
        ...(filters.groupId !== null && { smallGroupId: filters.groupId }),
        from: filters.from ?? defaults.from,
        to: filters.to ?? defaults.to,
        status: filters.status,
        q: filters.q,
        page: nextPage,
        pageSize: data.pageSize,
      });

      if (result.ok) {
        setExtra((current) => [...current, ...result.data.items]);
        setNextPage(nextPage + 1);
      }
    });
  }

  return (
    <div className="grid gap-3 md:hidden">
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">{t("noMatches")}</p>
      ) : (
        items.map((item) => (
          <ReportCard
            key={`${item.kind}-${item.smallGroup.id}-${item.meetingDate}`}
            canSubmit={canSubmit}
            item={item}
            leader={leaders[item.smallGroup.id]}
          />
        ))
      )}
      {shown < data.total && (
        <Button
          className="w-full font-semibold"
          isPending={isPending}
          variant="outline"
          onPress={showMore}
        >
          {t("showMore")}
        </Button>
      )}
    </div>
  );
}

// Toolbar, table (md and up) and cards (below md). Every filter lives in the URL; a change runs in
// a transition, so the current rows stay (dimmed) until the new page arrives and the search box
// keeps focus.
export default function ReportsBrowser({
  data,
  filters,
  defaults,
  groups,
  scoped,
  canSubmit,
  leaders,
  noMatchesTitle,
  clearFiltersLabel,
}: {
  data: ReportList;
  filters: ReportFilters;
  defaults: { from: string; to: string };
  groups: GroupOption[];
  scoped: boolean;
  canSubmit: boolean;
  /** Current leader's name by group id; groups without one have no entry. */
  leaders: Record<number, string>;
  /** `ReportsPage` strings, passed down so that namespace stays on the server. */
  noMatchesTitle: string;
  clearFiltersLabel: string;
}) {
  const t = useTranslations("ReportsList");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(filters.q);
  const [sheetOpen, setSheetOpen] = useState(false);
  const from = filters.from ?? defaults.from;
  const to = filters.to ?? defaults.to;

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }

    // Any filter change goes back to the first page.
    if (!("page" in changes)) params.delete("page");

    const search = params.toString();

    startTransition(() => {
      router.replace(search ? `${pathname}?${search}` : pathname, {
        scroll: false,
      });
    });
  }

  // Search as you type, a beat after the last key.
  const lastQuery = useRef(filters.q);

  useEffect(() => {
    if (query.trim() === lastQuery.current) return;

    const timer = window.setTimeout(() => {
      lastQuery.current = query.trim();
      update({ q: query.trim() });
    }, 300);

    return () => window.clearTimeout(timer);
    // `update` only reads the URL and the router.
  }, [query]);

  const groupFilter = (
    <GroupFilter
      groups={groups}
      scoped={scoped}
      value={filters.groupId}
      onChange={(id) => update({ groupId: id === null ? null : String(id) })}
    />
  );
  const datesFilter = (
    <DatesFilter
      from={from}
      max={defaults.to}
      to={to}
      onChange={(nextFrom, nextTo) => update({ from: nextFrom, to: nextTo })}
    />
  );
  const searchField = (
    <TextField
      aria-label={t("search")}
      className="w-full md:w-[260px]"
      type="search"
      value={query}
      onChange={setQuery}
    >
      <InputGroup className="h-10 w-full">
        <InputGroup.Prefix className="border-0 pl-3 pr-2">
          <MagnifyingGlassIcon
            className="pointer-events-none size-4 shrink-0 text-muted"
            strokeWidth={1.8}
          />
        </InputGroup.Prefix>
        <InputGroup.Input
          className="text-sm"
          placeholder={t("searchPlaceholder")}
        />
      </InputGroup>
    </TextField>
  );
  const statusTabs = (
    <StatusTabs
      ariaLabel={t("status")}
      counts={data.counts}
      options={[
        { key: "all", label: t("all") },
        { key: "filed", label: t("filed") },
        { key: "notHeld", label: t("noMeeting") },
        { key: "notFiled", label: t("notFiled") },
      ]}
      value={filters.status}
      onChange={(status) =>
        update({ status: status === "all" ? null : status })
      }
    />
  );

  const noMatches = data.total === 0 && hasActiveFilters(filters);

  function clearFilters() {
    setQuery("");
    lastQuery.current = "";
    update({
      groupId: null,
      from: null,
      to: null,
      status: null,
      q: null,
      page: null,
    });
  }

  return (
    <>
      {/* md and up: every control in one row. */}
      <div className="hidden flex-wrap items-end gap-3 md:flex">
        {groupFilter}
        {datesFilter}
        {statusTabs}
        <div className="ml-auto">{searchField}</div>
      </div>

      {/* Below md: search and a Filters button, with the status control always visible. */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center gap-2">
          {searchField}
          <Button
            className="h-10 shrink-0 gap-2 px-3.5 font-semibold"
            variant="outline"
            onPress={() => setSheetOpen(true)}
          >
            <AdjustmentsHorizontalIcon
              aria-hidden="true"
              className="size-[18px]"
              strokeWidth={1.8}
            />
            {t("filters")}
          </Button>
        </div>
        {statusTabs}
      </div>

      <Modal.Backdrop isOpen={sheetOpen} onOpenChange={setSheetOpen}>
        <Modal.Container placement="bottom" size="md">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading className="font-display text-2xl font-medium text-heading">
                {t("filters")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 overflow-visible p-1">
              {groupFilter}
              {datesFilter}
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="w-full font-semibold"
                onPress={() => setSheetOpen(false)}
              >
                {t("done")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <p aria-live="polite" className="sr-only">
        {t("results", { count: data.total })}
      </p>

      <div
        aria-busy={isPending}
        className={clsx(
          "flex flex-col gap-4 transition-opacity",
          isPending && "opacity-60",
        )}
      >
        {noMatches ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-field-border px-[22px] py-6">
            <p className="font-display text-xl text-heading">
              {noMatchesTitle}
            </p>
            <Button
              className="font-semibold"
              variant="outline"
              onPress={clearFilters}
            >
              {clearFiltersLabel}
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <ReportsTable
                canSubmit={canSubmit}
                items={data.items}
                leaders={leaders}
                page={data.page}
                pageSize={data.pageSize || REPORT_PAGE_SIZE}
                total={data.total}
                onPageChange={(page) => update({ page: String(page) })}
              />
            </div>
            <ReportCards
              key={`${JSON.stringify(filters)}-${data.total}`}
              canSubmit={canSubmit}
              data={data}
              defaults={defaults}
              filters={filters}
              leaders={leaders}
            />
          </>
        )}
      </div>
    </>
  );
}
