// Run with `node --test lib/format-date.test.ts` (Node strips the types; the repo has no runner).
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatCalendarMonth,
  formatCalendarRowDate,
  formatCalendarSpan,
} from "./format-date.ts";

test("a range inside one year shows the year once", () => {
  assert.equal(
    formatCalendarSpan("2026-10-20", "2026-10-28", "en"),
    "Oct 20 – Oct 28, 2026",
  );
  assert.equal(
    formatCalendarSpan("2026-07-29", "2026-10-28", "en"),
    "Jul 29 – Oct 28, 2026",
  );
  assert.equal(
    formatCalendarSpan("2026-10-20", "2026-10-28", "es"),
    "20 oct – 28 oct, 2026",
  );
});

test("a range across years shows both years", () => {
  assert.equal(
    formatCalendarSpan("2025-12-20", "2026-01-10", "en"),
    "Dec 20, 2025 – Jan 10, 2026",
  );
});

test("Spanish month headings drop the de", () => {
  assert.equal(formatCalendarMonth("2026-10-01", "es"), "octubre 2026");
  assert.equal(formatCalendarMonth("2026-10-01", "en"), "October 2026");
});

test("row dates: comma in English only", () => {
  assert.equal(formatCalendarRowDate("2026-10-27", "en"), "Tue, Oct 27");
  assert.equal(formatCalendarRowDate("2026-10-27", "es"), "mar 27 oct");
});
