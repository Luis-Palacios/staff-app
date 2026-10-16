// Smoke-tests a built image: runs it, then checks what the ALB health check can't see.
//
//   docker build -t staff-app:dev .
//   pnpm smoke staff-app:dev       exit 0 if every check passes, 1 if one fails, 2 on bad usage
//
// Checks, in order:
//   /api/health                     200: the server starts and its config validates.
//   a CSS file under /_next/static  200 text/css: the Dockerfile copied .next/static. Without it
//                                   pages render unstyled while /api/health stays 200.
//   /_next/image of the logo        200 image/webp: sharp's native module loads and converts.
//                                   It's the only native module in the image.
// The content types are the real checks: both failures still answer 200 (tested). Without
// .next/static the CSS URL returns an HTML page, and without sharp /_next/image serves the
// original PNG unconverted.
// On a failure it prints the container's logs. The container is always removed.
// Needs only node and docker on PATH, so it runs the same on macOS, Windows and Linux (CI).

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const image = process.argv[2];

if (!image) {
  console.error("usage: pnpm smoke <image>   e.g. pnpm smoke staff-app:dev");
  process.exit(2);
}

// The ministry logo is the only file in public/ today. Read its path from config, so the check
// follows the logo when it changes. If it's no longer there (multi-tenancy moves it to the
// session), point this at another image in public/.
const logoUrl = readFileSync(join(root, "config/site.ts"), "utf8").match(
  /logoUrl:\s*"([^"]+)"/,
)?.[1];

if (!logoUrl) {
  console.error(
    "No logoUrl in config/site.ts: point the image check at another file in public/.",
  );
  process.exit(2);
}

const docker = (...args) =>
  execFileSync("docker", args, { encoding: "utf8" }).trim();

// /api/health only validates the config (it never calls the other services), so addresses where
// nothing listens are enough. -p 127.0.0.1::3000 lets Docker pick a free host port.
const id = docker(
  "run",
  "--detach",
  "--publish",
  "127.0.0.1::3000",
  "--env",
  "AUTH_SERVER_URL=http://127.0.0.1:9",
  "--env",
  "APPLICATIONS_MEMBERSHIP_API_URL=http://127.0.0.1:9",
  image,
);
const remove = () => docker("rm", "--force", id);

process.on("SIGINT", () => {
  remove();
  process.exit(130);
});

// 127.0.0.1, not localhost: on Windows localhost tries ::1 first, and Docker only bound IPv4.
const base = `http://${docker("port", id, "3000/tcp").split("\n")[0]}`;
const get = (path, headers = {}) =>
  fetch(base + path, { headers, signal: AbortSignal.timeout(10_000) });

async function waitForServer() {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      return await get("/api/health");
    } catch {
      // Not listening yet.
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("server didn't answer on /api/health within 30s");
}

function expect(label, response, contentType) {
  const type = response.headers.get("content-type") ?? "";

  if (response.status !== 200 || !type.startsWith(contentType)) {
    throw new Error(
      `${label}: got ${response.status} ${type}, expected 200 ${contentType}`,
    );
  }
  console.log(`ok   ${label} (200 ${type})`);
}

let failed = false;

try {
  expect("/api/health", await waitForServer(), "application/json");

  const signIn = await get("/sign-in");
  const css = (await signIn.text()).match(/\/_next\/static\/[^"']+\.css/)?.[0];

  if (!css) throw new Error("/sign-in: no /_next/static CSS link in the page");
  expect(css, await get(css), "text/css");

  const optimized = `/_next/image?url=${encodeURIComponent(logoUrl)}&w=64&q=75`;

  expect(
    optimized,
    await get(optimized, { accept: "image/webp" }),
    "image/webp",
  );
} catch (error) {
  failed = true;
  console.error(`FAIL ${error.message}\n\n--- docker logs ${image} ---`);
  console.error(docker("logs", id));
} finally {
  remove();
}

process.exit(failed ? 1 : 0);
