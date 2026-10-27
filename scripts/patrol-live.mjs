#!/usr/bin/env node
/**
 * 线上巡检：抓真实站点，用与部署门禁同一套指标比对底线。
 *
 *   node scripts/patrol-live.mjs              # 抓线上页面，比对 patrol-baseline.json
 *   node scripts/patrol-live.mjs --update     # 仅在变好时压低底线
 *
 * 为什么部署门禁不够：patrol.mjs 只测 dist 里的构建产物。站点上线之后，
 * 页面仍可能变差——缓存被清、同步任务改写了数据、有人手工改了服务器上的文件。
 * 这些都不会触发部署，所以不会有任何门禁看到。stratat 的 patrol-daily.sh
 * 就是为这个原因存在的：它每天对线上实际在服务的产物再测一次，
 * 而且只报告、不自动改底线——否则失败的巡检会把底线改宽，第二天自己变绿。
 *
 * 这里的 `--update` 只在变好时写入，且由人来跑，不进 cron。
 *
 * 退出码：0 不低于底线，1 退步，2 测量失败（抓不到页面）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = process.env.PATROL_ORIGIN || 'https://www.androidadcleaner.com';
const baselinePath = process.env.PATROL_BASELINE || join(root, 'patrol-baseline.json');
const args = new Set(process.argv.slice(2));
const SIMILARITY_FLOOR = 0.6;

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'patrol-live/1.0' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.text();
}

let sitemapXml;
try {
  sitemapXml = await fetchText(`${ORIGIN}/sitemap-0.xml`);
} catch (err) {
  console.error(`patrol-live: 抓不到 sitemap — ${err.message}`);
  process.exit(2);
}

const paths = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  (m) => new URL(m[1]).pathname.replace(/\/$/, '') || '/',
);
if (paths.length === 0) {
  console.error('patrol-live: sitemap 里没有 URL，测量失败');
  process.exit(2);
}

const pages = new Map();
const CONCURRENCY = 6;
for (let i = 0; i < paths.length; i += CONCURRENCY) {
  const batch = paths.slice(i, i + CONCURRENCY);
  const results = await Promise.all(
    batch.map(async (p) => {
      try {
        return [p, await fetchText(`${ORIGIN}${p === '/' ? '' : p}`)];
      } catch (err) {
        return [p, null, err.message];
      }
    }),
  );
  for (const [p, html, error] of results) {
    if (html === null) {
      console.error(`patrol-live: ${p} 抓取失败 — ${error}`);
      process.exit(2);
    }
    pages.set(p, html);
  }
}

function signature(html) {
  const body = html.match(/<body[\s\S]*?<\/body>/i)?.[0] ?? html;
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return new Set(stripped.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}/g) ?? []);
}

let maxBytes = 0;
let maxBytesFile = '';
const sigs = [];
for (const [p, html] of pages) {
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > maxBytes) {
    maxBytes = bytes;
    maxBytesFile = p;
  }
  sigs.push([p, signature(html)]);
}

let pairs = 0;
for (let i = 0; i < sigs.length; i += 1) {
  for (let j = i + 1; j < sigs.length; j += 1) {
    const a = sigs[i][1];
    const b = sigs[j][1];
    if (!a.size || !b.size) continue;
    let shared = 0;
    for (const w of a) if (b.has(w)) shared += 1;
    if (shared / (a.size + b.size - shared) > SIMILARITY_FLOOR) pairs += 1;
  }
}

const jsonldMissing = [...pages].filter(([, html]) => !html.includes('application/ld+json')).length;
const pendingTodo = [...pages].filter(
  ([p, html]) => /^\/models\/[^/]+\/[^/]+$/.test(p) && html.includes('待补'),
).length;

const current = {
  pages: pages.size,
  htmlBytes: { max: maxBytes, file: maxBytesFile },
  similarity: { floor: SIMILARITY_FLOOR, pairs },
  sitemap: { urls: paths.length, missing: 0 },
  jsonld: { coverage: Number(((pages.size - jsonldMissing) / pages.size).toFixed(4)) },
  pendingTodo,
};

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;

const WORSE = [
  ['htmlBytes.max', (s) => s.htmlBytes.max],
  ['similarity.pairs', (s) => s.similarity.pairs],
  ['pendingTodo', (s) => s.pendingTodo],
];
const BETTER = [['jsonld.coverage', (s) => s.jsonld.coverage]];

const regressions = [];
const improvements = [];
if (baseline) {
  for (const [name, pick] of WORSE) {
    const was = pick(baseline);
    const now = pick(current);
    if (was === undefined) continue;
    if (now > was) regressions.push(`${name}: ${was} → ${now}`);
    else if (now < was) improvements.push(`${name}: ${was} → ${now}`);
  }
  for (const [name, pick] of BETTER) {
    const was = pick(baseline);
    const now = pick(current);
    if (was === undefined) continue;
    if (now < was) regressions.push(`${name}: ${was} → ${now}`);
    else if (now > was) improvements.push(`${name}: ${was} → ${now}`);
  }
}

// 抓回来的页面数少于 sitemap 声明的数量，本身就是问题：有路由 404 或没部署。
if (pages.size !== paths.length) {
  console.error(`patrol-live: 抓到 ${pages.size} 页，sitemap 声明 ${paths.length} 页`);
  process.exit(2);
}

console.log(`patrol-live: ${current.pages} 个页面 @ ${ORIGIN}`);
console.log(`  最大字节  ${current.htmlBytes.max} (${current.htmlBytes.file})`);
console.log(`  重复对数   ${current.similarity.pairs} (Jaccard > ${SIMILARITY_FLOOR})`);
console.log(`  JSON-LD    ${(current.jsonld.coverage * 100).toFixed(1)}%`);
console.log(`  待补机型页 ${current.pendingTodo}`);

if (!baseline) {
  console.log('\npatrol-live: 没有基线，写入当前数字');
  writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  process.exit(0);
}

if (regressions.length > 0) {
  console.error(`\npatrol-live: 线上相对底线退步 ${regressions.length} 项`);
  for (const line of regressions) console.error(`  ${line}`);
  process.exit(1);
}

if (args.has('--update') && improvements.length > 0) {
  writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`\npatrol-live: 变好 ${improvements.length} 项，已压低底线`);
  for (const line of improvements) console.log(`  ${line}`);
} else {
  console.log('\npatrol-live: 不低于底线');
}
process.exit(0);
