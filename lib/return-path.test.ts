// Run with `node --test lib/return-path.test.ts` (Node strips the types; the repo has no runner).
import assert from "node:assert/strict";
import { test } from "node:test";

import { safeReturnPath, signInHref } from "./return-path.ts";

test("an email link's path and query come through", () => {
  for (const path of [
    "/groups/reports/812?person=1207",
    "/groups/reports/8?guest=3",
    "/groups/reports/8?section=followUp",
    "/",
  ]) {
    assert.equal(safeReturnPath(path), path);
  }
});

test("anything that could leave the origin is refused", () => {
  for (const value of [
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "/..//evil.com",
    "/.//evil.com",
    "/\t/evil.com",
    "/a\nb",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeReturnPath(value), null, String(value));
  }
});

test("encoded slashes stay a path on this origin", () => {
  assert.equal(safeReturnPath("/%2F%2Fevil.com"), "/%2F%2Fevil.com");
  assert.equal(safeReturnPath("/%5Cevil.com"), "/%5Cevil.com");
});

test("auth pages and the API are never a return target", () => {
  assert.equal(safeReturnPath("/sign-in?next=/x"), null);
  assert.equal(safeReturnPath("/needs-role"), null);
  assert.equal(safeReturnPath("/api/auth/get-session"), null);
});

test("sign-in carries ?next= except for the dashboard", () => {
  assert.equal(
    signInHref("/groups/reports/8?person=39"),
    "/sign-in?next=%2Fgroups%2Freports%2F8%3Fperson%3D39",
  );
  assert.equal(signInHref("/"), "/sign-in");
  assert.equal(signInHref("//evil.com"), "/sign-in");
  assert.equal(signInHref(null), "/sign-in");
});
