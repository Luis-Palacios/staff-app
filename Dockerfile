# syntax=docker/dockerfile:1

# Pinned exactly (Node and Alpine), as in auth-server: the same commit always builds the same
# image, and version bumps arrive as their own commits.
ARG NODE_VERSION=24.21.0
ARG ALPINE_VERSION=3.24
# Must match devEngines/packageManager in package.json. If they drift, pnpm's onFail: "download"
# would fetch a different pnpm in the middle of the build.
ARG PNPM_VERSION=12.3.4

################################################################################
# Alpine (musl): ~60 MB smaller than trixie-slim. The only native runtime module is sharp (used by
# /_next/image), which ships an official musl build. If a native module ever breaks here, switch
# both stages to -slim.
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS build

WORKDIR /usr/src/app

# Next.js sends anonymous usage data by default.
ENV NEXT_TELEMETRY_DISABLED=1

# pnpm's install script swaps in its native binary. Allow it by name: npm 11 warns about unlisted
# install scripts, npm 12 blocks them. pnpm exists only in this stage.
RUN --mount=type=cache,target=/root/.npm \
    npm install -g --allow-scripts=pnpm pnpm@${PNPM_VERSION}

# All dependencies, dev included: next build needs typescript, tailwindcss and postcss. The final
# stage never gets this node_modules (standalone output copies only the files the server loads),
# so there's no separate --prod install as in auth-server. pnpm-workspace.yaml holds allowBuilds,
# which lets sharp, @tailwindcss/oxide and unrs-resolver run their install scripts.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=bind,source=pnpm-workspace.yaml,target=pnpm-workspace.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# After the install, so editing source doesn't reinstall dependencies.
COPY . .
# No env vars: config is validated on first use at run time (getEnv() in lib/env/server.ts).
RUN pnpm run build

################################################################################
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS final

WORKDIR /usr/src/app

# HOSTNAME: server.js binds to it, and Docker sets it to the container ID.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# standalone/ holds server.js plus the traced node_modules. It leaves out .next/static and public/;
# without them pages render with no CSS/JS while /api/health stays 200.
COPY --from=build /usr/src/app/.next/standalone ./
COPY --from=build /usr/src/app/.next/static ./.next/static
COPY --from=build /usr/src/app/public ./public

# Code stays root-owned, so the app can't modify it. Only Next's cache directory is writable:
# /_next/image writes optimized images there.
RUN mkdir .next/cache && chown node:node .next/cache

USER node

EXPOSE 3000

# Exec form, so node runs as PID 1 and receives SIGTERM directly.
CMD ["node", "server.js"]
