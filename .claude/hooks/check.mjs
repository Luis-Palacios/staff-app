// PostToolUse (Edit|Write): ESLint the edited file. Stop: ESLint every changed file, then tsc and the token check.
// Exit 2 sends the errors back to Claude. Stop runs too because most edits here go through Bash, which
// PostToolUse on Edit|Write never sees.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const input = JSON.parse(readFileSync(0, 'utf8'));
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32', timeout: 170_000 });
const lintable = (f) => /\.(m?[jt]sx?)$/.test(f) && !f.includes('node_modules') && !f.endsWith('.d.json.ts');
const fail = (msg) => { process.stderr.write(msg); process.exit(2); };

if (input.hook_event_name === 'PostToolUse') {
  const file = input.tool_input?.file_path;
  if (!file || !lintable(file) || path.relative(root, file).startsWith('..')) process.exit(0);
  const r = run('pnpm', ['exec', 'eslint', '--quiet', file]);
  if (r.status === 1) fail(`ESLint errors in ${file}:\n${r.stdout}`);
  process.exit(0);
}

// Stop
if (input.stop_hook_active) process.exit(0);
const changed = [
  ...run('git', ['diff', '--name-only', 'HEAD']).stdout.split('\n'),
  ...run('git', ['ls-files', '--others', '--exclude-standard']).stdout.split('\n'),
].filter((f) => f && existsSync(path.join(root, f)));
const errors = [];
const files = changed.filter(lintable);
if (files.length) {
  const r = run('pnpm', ['exec', 'eslint', '--quiet', ...files]);
  if (r.status === 1) errors.push(`ESLint:\n${r.stdout}`);
  const t = run('pnpm', ['exec', 'tsc', '--noEmit', '--pretty', 'false']);
  if (t.status !== 0) errors.push(`tsc:\n${t.stdout.split('\n').slice(0, 40).join('\n')}`);
}
if (changed.some((f) => f.startsWith('tokens/') || /^styles\/(brand|theme)\.css$/.test(f))) {
  const k = run('pnpm', ['tokens', '--check']);
  if (k.status !== 0) errors.push(`pnpm tokens --check failed (edit tokens/*.json, then run pnpm tokens):\n${k.stdout}${k.stderr}`);
}
if (errors.length) fail(`Checks on the changed files failed. Fix them before finishing:\n\n${errors.join('\n\n')}`);
