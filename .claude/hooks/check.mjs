// PostToolUse (Edit|Write): ESLint the edited file. Stop: ESLint every changed file, then tsc and the token check.
// Stop runs too because most edits here go through Bash, which
// PostToolUse on Edit|Write never sees.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const run = (cmd, args) => {
  const shell = process.platform === 'win32' && cmd === 'pnpm';
  if (shell && args.some((arg) => /[%"\r\n]/.test(arg))) {
    return { status: null, error: new Error('Cannot safely pass this path to pnpm on Windows.') };
  }
  const command = shell ? [cmd, ...args.map((arg) => `"${arg}"`)].join(' ') : cmd;
  return spawnSync(command, shell ? [] : args, {
    cwd: root, encoding: 'utf8', shell, timeout: 170_000,
  });
};
const lintable = (f) => /\.(m?[jt]sx?)$/.test(f) && !f.includes('node_modules') && !f.endsWith('.d.json.ts');
const fail = (msg) => {
  process.stdout.write(JSON.stringify({ decision: 'block', reason: msg, additionalContext: msg }));
  process.exit(0);
};
const details = (r) => [r.error?.message, r.stdout, r.stderr].filter(Boolean).join('\n') || `Exit status: ${r.status}`;

if (input.hook_event_name === 'PostToolUse') {
  const name = input.tool_input?.file_path || input.tool_input?.path;
  if (!name || !lintable(name)) process.exit(0);
  const file = path.resolve(root, name);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) process.exit(0);
  const r = run('pnpm', ['exec', 'eslint', '--quiet', file]);
  if (r.status !== 0) fail(`ESLint failed for ${file}:\n${details(r)}`);
  process.exit(0);
}

// Stop
if (input.stop_hook_active) process.exit(0);
const diff = run('git', ['diff', '--name-only', 'HEAD']);
const untracked = run('git', ['ls-files', '--others', '--exclude-standard']);
if (diff.status !== 0 || untracked.status !== 0) fail(`Could not list changed files:\n${details(diff.status !== 0 ? diff : untracked)}`);
const changed = [...diff.stdout.split('\n'), ...untracked.stdout.split('\n')]
  .filter((f) => f && existsSync(path.join(root, f)));
const errors = [];
const files = changed.filter(lintable);
if (files.length) {
  const r = run('pnpm', ['exec', 'eslint', '--quiet', ...files]);
  if (r.status !== 0) errors.push(`ESLint:\n${details(r)}`);
  const t = run('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false']);
  if (t.status !== 0) errors.push(`tsc:\n${details(t).split('\n').slice(0, 40).join('\n')}`);
}
if (changed.some((f) => f.startsWith('tokens/') || /^styles\/(brand|theme)\.css$/.test(f))) {
  const k = run('pnpm', ['tokens', '--check']);
  if (k.status !== 0) errors.push(`pnpm tokens --check failed (edit tokens/*.json, then run pnpm tokens):\n${details(k)}`);
}
if (errors.length) fail(`Checks on the changed files failed. Fix them before finishing:\n\n${errors.join('\n\n')}`);
