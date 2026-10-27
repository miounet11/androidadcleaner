#!/usr/bin/env node
/**
 * 把本次改动的 URL 主动推给 IndexNow（Bing / Yandex / Seznam 等）。
 *
 *   node scripts/indexnow-submit.mjs                 # 提交 sitemap 里全部 URL
 *   node scripts/indexnow-submit.mjs --since 2026-10-27
 *   node scripts/indexnow-submit.mjs --dry-run
 *
 * 为什么要它：sitemap 只是「告知可以来抓」，不保证会被抓。内容更新后主动推送，
 * 抓取延迟从「等爬虫发现」降到分钟级。stratat 站点有这个机制，我们此前没有。
 *
 * 密钥是公开的，不是凭据：public/<key>.txt 的内容必须等于文件名里的 key。
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL ?? 'https://www.androidadcleaner.com').replace(/\/$/, '');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sinceIdx = args.indexOf('--since');
const since = sinceIdx >= 0 ? args[sinceIdx + 1] : null;

if (sinceIdx >= 0 && (!since || Number.isNaN(Date.parse(since)))) {
  console.error(`indexnow: invalid since ${JSON.stringify(since)} (ISO-8601 date expected)`);
  process.exit(2);
}

/** 从 public/ 里找 <hex>.txt 且内容等于文件名（IndexNow 的密钥校验方式）。 */
function findKey() {
  const fromEnv = process.env.INDEXNOW_KEY?.trim();
  if (fromEnv) return fromEnv;

  const dir = join(ROOT, 'public');
  if (!existsSync(dir)) return '';
  for (const name of readdirSync(dir)) {
    if (!/^[a-f0-9]{16,128}\.txt$/.test(name)) continue;
    const body = readFileSync(join(dir, name), 'utf8').trim();
    const key = name.replace(/\.txt$/, '');
    if (body === key) return key;
  }
  return '';
}

/** 读 dist 里的 sitemap 分片。构建产物才有；没有就回退到 sitemap 索引里的分片。 */
function readSitemapUrls() {
  const dist = join(ROOT, 'dist');
  if (!existsSync(dist)) {
    console.error('indexnow: dist/ 不存在，先跑 npm run build');
    return [];
  }
  const urls = [];
  for (const name of readdirSync(dist)) {
    if (!/^sitemap-\d+\.xml$/.test(name)) continue;
    const xml = readFileSync(join(dist, name), 'utf8');
    for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
      const block = m[1];
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      if (!loc) continue;
      const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
      if (since && (!lastmod || Date.parse(lastmod) <= Date.parse(since))) continue;
      urls.push(loc);
    }
  }
  return urls;
}

const key = findKey();
if (!key) {
  console.error('indexnow: 找不到密钥，public/ 下需要 <hex>.txt 且内容等于文件名');
  process.exit(2);
}

const urls = readSitemapUrls();
if (urls.length === 0) {
  console.log('indexnow: 没有需要提交的 URL');
  process.exit(0);
}

const payload = {
  host: new URL(SITE).host,
  key,
  keyLocation: `${SITE}/${key}.txt`,
  urlList: urls,
};

console.log(`indexnow: ${urls.length} 个 URL @ ${SITE}${since ? ` (since ${since})` : ''}`);

if (dryRun) {
  console.log('indexnow: --dry-run，未发送');
  console.log(JSON.stringify(payload, null, 2).slice(0, 1200));
  process.exit(0);
}

// IndexNow 单次上限 10000 条，超过要分批。
const BATCH = 10_000;
let failed = 0;
for (let i = 0; i < urls.length; i += BATCH) {
  const batch = { ...payload, urlList: urls.slice(i, i + BATCH) };
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(20_000),
    });
    // 200/202 都算接收成功；其他状态码要让人看见，不能静默。
    if (res.status !== 200 && res.status !== 202) {
      failed++;
      console.error(`indexnow: batch ${i / BATCH + 1} HTTP ${res.status} ${res.statusText}`);
    } else {
      console.log(`indexnow: batch ${i / BATCH + 1} HTTP ${res.status}`);
    }
  } catch (err) {
    failed++;
    console.error(`indexnow: batch ${i / BATCH + 1} ${err.message}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
