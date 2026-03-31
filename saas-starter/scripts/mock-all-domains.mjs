/**
 * Runs logistics + gig + retail mock upstreams in one process group (Ctrl+C stops all).
 * Run: pnpm mock:domains
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const scripts = [
  'mock-logistics-server.mjs',
  'mock-gig-server.mjs',
  'mock-retail-server.mjs'
];

const children = scripts.map((name) =>
  spawn(process.execPath, [path.join(dir, name)], {
    stdio: 'inherit',
    env: process.env
  })
);

function shutdown() {
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});

for (const c of children) {
  c.on('exit', (code, signal) => {
    if (signal) shutdown();
    else if (code !== 0 && code !== null) {
      shutdown();
      process.exit(code);
    }
  });
}
