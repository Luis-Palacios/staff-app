// Run with `node --test lib/resolved-period.test.ts` (Node strips the types; the repo has no runner).
import assert from "node:assert/strict";
import { test } from "node:test";

import { parseResolvedPeriod, resolvedSinceFor } from "./resolved-period.ts";

const MANAGUA = "America/Managua"; // UTC−6, no daylight saving
const AT = new Date("2026-11-06T18:30:00.000Z"); // 12:30 in Managua

test("an unknown or missing period is the default", () => {
  assert.equal(parseResolvedPeriod(undefined), "30d");
  assert.equal(parseResolvedPeriod("nope"), "30d");
  assert.equal(parseResolvedPeriod("3m"), "3m");
  assert.equal(parseResolvedPeriod("all"), "all");
});

test("last 30 days is 30 days before now", () => {
  assert.equal(
    resolvedSinceFor("30d", MANAGUA, AT),
    "2026-10-07T18:30:00.000Z",
  );
});

test("last 3 months is calendar months", () => {
  assert.equal(resolvedSinceFor("3m", MANAGUA, AT), "2026-08-06T18:30:00.000Z");
  // May 31 − 3 months clamps to Feb 28, not into March.
  assert.equal(
    resolvedSinceFor("3m", MANAGUA, new Date("2026-05-31T18:00:00.000Z")),
    "2026-02-28T18:00:00.000Z",
  );
});

test("this year starts at midnight in the church's zone", () => {
  assert.equal(
    resolvedSinceFor("year", MANAGUA, AT),
    "2026-01-01T06:00:00.000Z",
  );
  // Already Jan 1 in UTC but still Dec 31 in Managua: still last year.
  assert.equal(
    resolvedSinceFor("year", MANAGUA, new Date("2027-01-01T03:00:00.000Z")),
    "2026-01-01T06:00:00.000Z",
  );
});

test("all time has no filter", () => {
  assert.equal(resolvedSinceFor("all", MANAGUA, AT), null);
});
