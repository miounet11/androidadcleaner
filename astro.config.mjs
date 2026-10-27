import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 站点版本发布日期，机型页的 lastmod 基准
const SITE_UPDATED = '2026-10-25';

// 已翻译路径 → 该路径下存在的语言。必须与 src/i18n/config.ts 的
// TRANSLATED_PATHS 保持一致；两处不同步会让 sitemap 声明页面内不存在的
// 备用语言，正是 Google 明确列为错误的做法。
const SITE_ORIGIN = 'https://www.androidadcleaner.com';
const TRANSLATIONS = {
  '/': ['zh-CN', 'en'],
  '/download': ['zh-CN', 'en'],
  '/features': ['zh-CN', 'en'],
};
const HREFLANG = { 'zh-CN': 'zh-CN', en: 'en' };

/** 语言首页要带斜杠，与页面内 hreflang 的写法保持一致。 */
function urlFor(path, locale) {
  const base = locale === 'zh-CN' ? path : `/en${path === '/' ? '/' : path}`;
  if (base === '/') return `${SITE_ORIGIN}/`;
  if (base === '/en/' || base === '/en') return `${SITE_ORIGIN}/en/`;
  return `${SITE_ORIGIN}${base}`;
}

// 教程 slug → updated 日期，从 frontmatter 读取，避免手写两处
const GUIDE_UPDATED = Object.fromEntries(
  readdirSync('src/content/guides')
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const src = readFileSync(join('src/content/guides', f), 'utf8');
      const m = src.match(/^updated:\s*(\S+)/m);
      return [f.replace(/\.md$/, ''), m ? m[1].replace(/['"]/g, '') : SITE_UPDATED];
    }),
);

export default defineConfig({
  site: 'https://www.androidadcleaner.com',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  image: {
    service: passthroughImageService(),
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '') || '/';

        // sitemap 与 hreflang/canonical 必须用同一个 URL 形式，否则搜索引擎
        // 会认为是两个页面。语言首页统一写成带斜杠的 /en/。
        if (path === '/en') {
          item.url = `${new URL(item.url).origin}/en/`;
        }

        // 机型页与教程页按真实更新日期给 lastmod，其余用站点更新日期
        let lastmod = SITE_UPDATED;

        const guide = path.match(/^\/guides\/([^/]+)$/);
        if (guide && GUIDE_UPDATED[guide[1]]) {
          lastmod = GUIDE_UPDATED[guide[1]];
        }

        // 首页与下载页随版本发布更新，优先级最高
        if (path === '/' || path === '/download' || path.startsWith('/download/')) {
          item.priority = 0.9;
        } else if (path.startsWith('/models/')) {
          item.priority = path.split('/').length > 3 ? 0.8 : 0.75;
        } else if (path.startsWith('/guides/')) {
          item.priority = 0.7;
        }

        item.lastmod = new Date(`${lastmod}T00:00:00Z`).toISOString();

        // xhtml:link 备用语言。只给确实有译文的路径加，未翻译页面留空。
        const bare = path.replace(/^\/en(?=\/|$)/, '') || '/';
        const locales = TRANSLATIONS[bare === '/en' ? '/' : bare];
        if (locales) {
          item.links = locales.map((locale) => ({
            lang: HREFLANG[locale],
            url: urlFor(bare === '/en' ? '/' : bare, locale),
          }));
          item.links.push({ lang: 'x-default', url: urlFor(bare === '/en' ? '/' : bare, 'zh-CN') });
        }

        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
