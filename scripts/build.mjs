import { access, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'dist');

async function exists(target) {
  try {
    await access(target, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyIfExists(from, to) {
  if (await exists(from)) {
    await cp(from, to, { recursive: true });
  }
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await copyIfExists(path.join(rootDir, 'index.html'), path.join(outDir, 'index.html'));
await copyIfExists(path.join(rootDir, '_headers'), path.join(outDir, '_headers'));
await copyIfExists(path.join(rootDir, '_redirects'), path.join(outDir, '_redirects'));

// Optional asset directories. Add these later if the site grows.
for (const dir of ['assets', 'public']) {
  const source = path.join(rootDir, dir);
  if (await exists(source)) {
    if (dir === 'public') {
      for (const entry of await readdir(source)) {
        await cp(path.join(source, entry), path.join(outDir, entry), { recursive: true });
      }
    } else {
      await cp(source, path.join(outDir, dir), { recursive: true });
    }
  }
}

console.log('Build complete: dist/');
