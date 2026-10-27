#!/usr/bin/env node
/**
 * 质量棘轮：今天的数字是底线，明天不能更差。
 *
 *   node scripts/patrol.mjs            # 测量，与 patrol-baseline.json 比较
 *   node scripts/patrol.mjs --update   # 测量，并在变好时压低底线
 *
 * 为什么是棘轮而不是固定阈值：本站现在就有 33 个机型页验证日期是「待补」、
 * 599 对页面相似度超过 0.6。用固定阈值会让每次构建都失败，等于没有门禁；
 * 用「不许更差」则能立刻挡住新的重复页和新的待补页，同时不阻塞现有发布。
 *
 * `--update` 只会把数字改好（重复对数变少、待补页变少、字节变小）。
 * 变差时永远不写底线，坏构建无法给自己盖章。
 *
 * 退出码：0 不低于底线，1 低于底线，2 测量本身失败（没有构建产物、
 * 检查跑不起来）。1 和 2 是两件事：一个是站点变差了，一个是根本没测到。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = process.env.SITE_DIST_DIR || join(root, 'dist');
const baselinePath = process.env.PATROL_BASELINE || join(root, 'patrol-baseline.json');
const args = new Set(process.argv.slice(2));

if (!existsSync(dist)) {
  console.error(`patrol: 没有构建产物 ${relative(root, dist)} — 先跑 npm run build`);
  process.exit(2);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const files = walk(dist).filter((f) => !f.endsWith('404.html'));
if (files.length === 0) {
  console.error('patrol: 没找到任何页面，测量失败');
  process.exit(2);
}

// 页面字节：取最大的那个，平均没有意义——一个 68KB 的机型页拖慢首屏，正是要盯的。
let maxBytes = 0;
let maxBytesFile = '';
const pages = new Map();
for (const f of files) {
  const size = statSync(f).size;
  if (size > maxBytes) {
    maxBytes = size;
    maxBytesFile = relative(dist, f);
  }
  pages.set(f, readFileSync(f, 'utf8'));
}

// 相似度：词集 Jaccard。机型页共用模板，是本项目最可能堆积重复内容的页面类型。
function signature(html) {
  const body = html.match(/<body[\s\S]*?<\/body>/i)?.[0] ?? html;
  const stripped = body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return new Set(stripped.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z]{3,}/g) ?? []);
}

const sigs = [...pages].map(([f, html]) => [f, signature(html)]);
const SIMILARITY_FLOOR = 0.6;
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

// sitemap 一致性：sitemap 里的每个 URL 都要能落到一个已生成的文件。
const sitemapFile = join(dist, 'sitemap-0.xml');
let sitemapUrls = 0;
const sitemapMissing = [];
if (existsSync(sitemapFile)) {
  const locs = readFileSync(sitemapFile, 'utf8').match(/<loc>([^<]+)<\/loc>/g) ?? [];
  sitemapUrls = locs.length;
  for (const loc of locs) {
    const path = new URL(loc.replace(/<\/?loc>/g, '')).pathname.replace(/\/$/, '') || '/';
    const target = path === '/' ? join(dist, 'index.html') : join(dist, path, 'index.html');
    if (!existsSync(target) && !existsSync(join(dist, `${path}.html`))) {
      sitemapMissing.push(path);
    }
  }
}

// 结构化数据覆盖率：每个可索引页面都要有 JSON-LD。
const jsonldMissing = [...pages].filter(([, html]) => !html.includes('application/ld+json')).map(([f]) =>
  relative(dist, f),
);

// 待补项：机型页里验证日期没落地的页面。这是内容债，只许变少。
const pendingTodo = [...pages].filter(([f]) => /\/models\/[^/]+\/[^/]+\/index\.html$/.test(f) && pages.get(f).includes('待补')).length;

const current = {
  pages: files.length,
  htmlBytes: { max: maxBytes, file: maxBytesFile },
  similarity: { floor: SIMILARITY_FLOOR, pairs },
  sitemap: { urls: sitemapUrls, missing: sitemapMissing.length },
  jsonld: { coverage: Number(((pages.size - jsonldMissing.length) / pages.size).toFixed(4)) },
  pendingTodo,
};

const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;

// 每一项都是「越小越好」，除了 jsonld 覆盖率是「越大越好」。
const WORSE = [
  ['htmlBytes.max', (s) => s.htmlBytes.max],
  ['similarity.pairs', (s) => s.similarity.pairs],
  ['sitemap.missing', (s) => s.sitemap.missing],
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

console.log(`patrol: ${current.pages} 个页面`);
console.log(`  最大字节  ${current.htmlBytes.max} (${current.htmlBytes.file})`);
console.log(`  重复对数   ${current.similarity.pairs} (Jaccard > ${SIMILARITY_FLOOR})`);
console.log(`  sitemap    ${current.sitemap.urls} 条，缺失 ${current.sitemap.missing}`);
console.log(`  JSON-LD    ${(current.jsonld.coverage * 100).toFixed(1)}%`);
console.log(`  待补机型页 ${current.pendingTodo}`);

if (!baseline) {
  console.log('\npatrol: 没有基线，写入当前数字作为第一版底线');
  writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  process.exit(0);
}

if (regressions.length > 0) {
  console.error(`\npatrol: 相对底线退步 ${regressions.length} 项 — 线上不受影响`);
  for (const line of regressions) console.error(`  ${line}`);
  process.exit(1);
}

if (args.has('--update') && improvements.length > 0) {
  writeFileSync(baselinePath, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`\npatrol: 变好 ${improvements.length} 项，已压低底线`);
  for (const line of improvements) console.log(`  ${line}`);
} else {
  console.log('\npatrol: 不低于底线');
}
process.exit(0);
