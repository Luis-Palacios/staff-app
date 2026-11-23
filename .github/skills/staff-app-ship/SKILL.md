---
name: staff-app-ship
description: Run the staff-app shipping workflow only when explicitly invoked as /staff-app-ship.
argument-hint: "[push | pr | main]"
disable-model-invocation: true
---

Use this workflow only when the user explicitly invokes `/staff-app-ship`. An invocation without arguments
authorizes a commit only; `push` also authorizes pushing the branch, `pr` also authorizes opening a PR,
and `main` authorizes committing and pushing directly to main. Otherwise obtain explicit approval before
each push, PR creation, or production action. Never merge or enable auto-merge without explicit approval.

1. Inspect the branch, `git status --short`, and `git diff --stat`. On main without `main` requested,
   propose a branch using the workspace's branch conventions and ask before proceeding. Identify unrelated
   changes and ask which belong; don't include other people's work without approval.
2. All checks must pass before shipping: `pnpm lint` (it fixes files) and `pnpm exec tsc --noEmit`.
   If `tokens/` changed, run `pnpm tokens --check`. If `Dockerfile`, `.dockerignore`, `next.config.mjs`,
   or dependencies changed, build with `docker build -t staff-app:dev .` and run `pnpm smoke staff-app:dev`.
   For UI changes, verify in a browser after the last edit. Do not ship if a required check or verification
   is unavailable or fails; report the blocker.
3. If following a handoff, update its progress log and decisions or deviations in the same commit.
4. Review the exact diff, then commit one stage at a time. Use a plain-sentence subject, adding the stage
   in brackets when applicable; no `feat:` prefix. Add a body when the reason is not obvious. Follow
   applicable commit-trailer instructions.
5. If authorized, push with `git push -u origin <branch>`. If authorized to open a PR, use the app's PR
   tool when available, otherwise `gh pr create`, targeting the intended base. Include a summary by area
   and verification in the PR body. Do not enable auto-merge.
6. Report the commit hash, PR URL if created, verification, and any cross-repository follow-up.
