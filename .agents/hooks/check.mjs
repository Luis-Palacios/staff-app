// Stop: ESLint every changed file, then tsc and the token check.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raw = readFileSync(0, 'utf8');
const input = raw.trim() ? JSON.parse(raw) : {};

if (
  input.continuationActive === true ||
  input.terminationReason === 'USER_CANCELED' ||
  input.terminationReason === 'ERROR'
) {
  process.stdout.write('{}');
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32', timeout: 170_000 });
const lintable = (f) => /\.(m?[jt]sx?)$/.test(f) && !f.includes('node_modules') && !f.endsWith('.d.json.ts');

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
  if (k.status !== 0) {
    errors.push(`pnpm tokens --check failed (edit tokens/*.json, then run pnpm tokens):\n${k.stdout}${k.stderr}`);
  }
}

if (errors.length) {
  process.stdout.write(
    JSON.stringify({
      decision: 'continue',
      reason: `Checks on the changed files failed. Fix them before finishing:\n\n${errors.join('\n\n')}`,
    }),
  );
} else {
  process.stdout.write('{}');
}
