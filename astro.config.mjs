import { defineConfig, passthroughImageService } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// 站点版本发布日期，机型页的 lastmod 基准
const SITE_UPDATED = '2026-10-25';

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
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
