#!/usr/bin/env node
/**
 * Sincroniza el mapa con el estado real del repositorio SAMIFRUVER.
 *
 * Se ejecuta solo antes de `npm run dev` y `npm run build` (predev / prebuild),
 * así que cada despliegue publica datos frescos. Genera public/repo-status.json con:
 *   - el último commit del repo y de la carpeta de cada módulo,
 *   - los módulos cuya carpeta ya no existe (enlace roto),
 *   - las carpetas nuevas que todavía no aparecen en el mapa.
 *
 * Fuentes de datos, en orden:
 *   1. git local: cuando el mapa vive dentro del repo SAMIFRUVER (lo normal en Netlify).
 *   2. API de GitHub: si no hay historial local. GITHUB_TOKEN es opcional (sube el límite de 60 → 5000 req/h).
 * Si ambas fallan, escribe el error en el JSON y NO rompe el build: el mapa sigue funcionando sin estos datos.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARCH_PATH = join(ROOT, 'src/data/architecture.json');
const OUT_PATH = join(ROOT, 'public/repo-status.json');

const architecture = JSON.parse(readFileSync(ARCH_PATH, 'utf8'));
const { repo, branch = 'main', sync: syncConfig = {} } = architecture.meta;
const [, owner, repoName] = new URL(repo).pathname.split('/');
const API = process.env.GITHUB_API_URL || 'https://api.github.com';

const log = (...args) => console.log('[sync-repo]', ...args);

/* ---------- Ruta dentro del repo para cada nodo, a partir de su githubLink ---------- */
function repoPathOf(node) {
  const url = new URL(node.githubLink);
  const match = url.pathname.match(/\/(?:tree|blob)\/[^/]+\/(.+)$/);
  if (match) return decodeURIComponent(match[1]).replace(/\/$/, '');
  return 'README.md'; // épicas: enlazan a una sección del README
}

/* ---------- Fuente 1: git local ---------- */
function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

function findLocalRepo() {
  try {
    const top = process.env.REPO_DIR ? resolve(process.env.REPO_DIR) : git(['rev-parse', '--show-toplevel'], ROOT);
    const wanted = `${owner}/${repoName}`.toLowerCase();
    let remote = '';
    try {
      remote = git(['remote', 'get-url', 'origin'], top).toLowerCase();
    } catch {
      /* sin remote */
    }
    const netlifyRepo = (process.env.REPOSITORY_URL || '').toLowerCase();
    if (!process.env.REPO_DIR && !remote.includes(wanted) && !netlifyRepo.includes(wanted)) return null;

    if (git(['rev-parse', '--is-shallow-repository'], top) === 'true') {
      log('clon superficial: intentando traer el historial completo…');
      try {
        git(['fetch', '--unshallow', '--quiet'], top);
      } catch {
        log('no se pudo completar el historial; se usará la API de GitHub');
        return null;
      }
    }
    return top;
  } catch {
    return null;
  }
}

function fromGit(dir) {
  const parse = (line) => {
    if (!line) return null;
    const [sha, date, author, message] = line.split('\x1f');
    return { sha, date, author, message, url: `${repo}/commit/${sha}` };
  };
  const lastCommit = (path) =>
    parse(git(['log', '-1', '--format=%H%x1f%cI%x1f%an%x1f%s', '--', path], dir));

  const dirs = new Set(git(['ls-tree', '-r', '-d', '--name-only', 'HEAD'], dir).split('\n').filter(Boolean));
  const files = new Set(git(['ls-tree', '-r', '--name-only', 'HEAD'], dir).split('\n').filter(Boolean));

  return {
    source: 'git',
    head: lastCommit('.'),
    exists: (p) => dirs.has(p) || files.has(p),
    dirs,
    lastCommit: async (p) => lastCommit(p),
  };
}

/* ---------- Fuente 2: API de GitHub ---------- */
async function gh(path) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'samifruver-arch-map' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`${API}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} en ${path}`);
  return res.json();
}

async function fromApi() {
  const base = `/repos/${owner}/${repoName}`;
  const tree = await gh(`${base}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const dirs = new Set(tree.tree.filter((t) => t.type === 'tree').map((t) => t.path));
  const files = new Set(tree.tree.filter((t) => t.type === 'blob').map((t) => t.path));

  const toCommit = (c) =>
    c && {
      sha: c.sha,
      date: c.commit.committer.date,
      author: c.commit.author.name,
      message: c.commit.message.split('\n')[0],
      url: c.html_url,
    };
  const lastCommit = async (p) => {
    const list = await gh(`${base}/commits?sha=${encodeURIComponent(branch)}&per_page=1&path=${encodeURIComponent(p)}`);
    return toCommit(list[0]);
  };

  return {
    source: 'github-api',
    head: toCommit((await gh(`${base}/commits?sha=${encodeURIComponent(branch)}&per_page=1`))[0]),
    exists: (p) => dirs.has(p) || files.has(p),
    dirs,
    lastCommit,
  };
}

/* ---------- Carpetas del repo que aún no están en el mapa ---------- */
function findUnmapped(dirs, nodePaths) {
  const watch = syncConfig.watch ?? [];
  const ignore = new Set(syncConfig.ignore ?? []);
  const unmapped = [];

  for (const parent of watch) {
    const prefix = parent === '.' ? '' : `${parent}/`;
    for (const d of dirs) {
      if (!d.startsWith(prefix)) continue;
      const rest = d.slice(prefix.length);
      if (!rest || rest.includes('/')) continue; // solo hijos directos

      const mapped =
        ignore.has(d) ||
        watch.includes(d) ||
        nodePaths.some((p) => p === d || p.startsWith(`${d}/`));
      if (!mapped) unmapped.push(d);
    }
  }
  return [...new Set(unmapped)].sort();
}

/* ---------- Principal ---------- */
async function main() {
  const status = {
    generatedAt: new Date().toISOString(),
    repo,
    branch,
    source: 'none',
    head: null,
    nodes: {},
    missing: [],
    unmapped: [],
    error: null,
  };

  try {
    const local = findLocalRepo();
    let src;
    if (local) {
      src = fromGit(local);
    } else {
      try {
        src = await fromApi();
      } catch (apiError) {
        throw new Error(`No hay repo local ni acceso a la API de GitHub (${apiError.message})`);
      }
    }

    status.source = src.source;
    status.head = src.head;

    const nodePaths = architecture.nodes.map(repoPathOf);
    for (const node of architecture.nodes) {
      const path = repoPathOf(node);
      const exists = src.exists(path);
      status.nodes[node.id] = { path, exists, lastCommit: exists ? await src.lastCommit(path) : null };
      if (!exists) status.missing.push(node.id);
    }
    status.unmapped = findUnmapped(src.dirs, nodePaths);

    log(`fuente: ${status.source} · HEAD ${status.head?.sha?.slice(0, 7) ?? '?'}`);
    if (status.missing.length) log(`⚠ módulos con carpeta inexistente: ${status.missing.join(', ')}`);
    if (status.unmapped.length) log(`⚠ carpetas sin representar en el mapa: ${status.unmapped.join(', ')}`);
  } catch (error) {
    status.error = error.message;
    log(`⚠ ${error.message}. El mapa se publicará sin datos de actividad.`);
  }

  if (!existsSync(dirname(OUT_PATH))) mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(status, null, 2)}\n`);
  log(`escrito ${OUT_PATH.replace(`${ROOT}/`, '')}`);
}

main();
