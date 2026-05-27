import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const requestedDir = process.argv[2] ? path.resolve(rootDir, process.argv[2]) : rootDir;
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon']
]);

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^([/\])+/, '');
  const resolved = path.resolve(requestedDir, normalized || 'index.html');
  if (!resolved.startsWith(requestedDir)) return null;
  return resolved;
}

const server = http.createServer(async (req, res) => {
  try {
    const filePath = safePath(req.url || '/');
    if (!filePath) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let target = filePath;
    const info = await stat(target).catch(() => null);
    if (info?.isDirectory()) target = path.join(target, 'index.html');

    const body = await readFile(target).catch(async () => {
      if (path.extname(filePath) === '') {
        return await readFile(path.join(requestedDir, 'index.html'));
      }
      throw new Error('Not found');
    });

    res.writeHead(200, {
      'Content-Type': mimeTypes.get(path.extname(target)) || 'application/octet-stream'
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(port, () => {
  console.log(`Local server: http://localhost:${port}`);
  console.log(`Serving: ${requestedDir}`);
});
