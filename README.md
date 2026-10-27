# androidadcleaner.com

安卓去广告工具的官方网站与工具链仓库。

- 站点：<https://www.androidadcleaner.com>
- 工具代码与安装包：<https://github.com/miounet11/android-ad-cleaner>

Astro 静态站点，对标驱动之家 / 恩山论坛的内容组织方式：以机型为骨架、以教程为血肉。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:4321
npm run check    # 类型检查（astro check）
npm run build    # 输出到 dist/
./scripts/deploy.sh
```

## 发布链路

`./scripts/deploy.sh` 依次执行，前四步是硬门禁（任一失败即中止，线上保持上一个可用版本）：

| 步骤 | 说明 |
|---|---|
| 构建 | `astro build` |
| 类型检查 | `astro check`，需 `tsconfig.json`，否则内容集合类型退化成 `any` |
| 质量门禁 | `scripts/patrol.mjs` 对比 `patrol-baseline.json`，只许持平或变好 |
| 同步 | rsync 到服务器，并同步巡检脚本与基线到 `/opt/androidadcleaner/` |
| IndexNow | 主动推送变更 URL（软步骤，失败不阻断） |
| 健康检查 | 关键路由 200 + HTTP→HTTPS 跳转 |

线上每日 03:40 由 `patrol-daily.sh` 复测真实页面，退步时发飞书告警。详见 [DEPLOY.md](./DEPLOY.md)。

## 内容架构

| 路径 | 说明 | 页面数 |
|---|---|---|
| `/` | 首页：能力、品牌入口、教程精选 | 1 |
| `/models` | 机型库总览，7 大品牌 | 1 |
| `/models/[brand]` | 品牌页：广告投放面、避坑点、机型列表 | 7 |
| `/models/[brand]/[code]` | 机型详情：路径清单、脚本状态、FAQ | 19 |
| `/guides` | 教程库，按分类筛选 | 1 |
| `/guides/[slug]` | 教程详情，含 Article + HowTo 结构化数据 | 12 |
| `/download` `/download/pc` `/download/ios` | 下载入口 | 3 |
| `/features` `/faq` `/changelog` `/about` | 功能、问答、更新记录、关于 | 4 |
| `/404` | 404 页 | 1 |

合计 49 个静态页面。

## 目录

```
src/
├── consts.ts              站点常量、导航
├── content.config.ts      教程集合 schema
├── content/guides/*.md    教程正文（12 篇）
├── data/models.ts         机型数据库（7 品牌 / 19 机型）
├── lib/schema.ts          JSON-LD 生成函数
├── components/            Seo、Header、Footer
├── layouts/Base.astro     页面外壳
└── pages/                 路由
public/                    robots.txt、sitemap 源、OG 图、图标
deploy/                    nginx 配置副本
scripts/                   部署、新建教程
```

## SEO 设计

- 每页独立 `title` / `description` / `canonical`（统一 `www` 前缀）
- Open Graph + Twitter Card，`og-default.png` 1200×630
- 结构化数据：`Organization`、`WebSite`（含 SearchAction）、`SoftwareApplication`、
  `BreadcrumbList`、`Article`、`HowTo`、`FAQPage`、`ItemList`、`Product`
- sitemap 由 `@astrojs/sitemap` 生成，含 `lastmod` / `changefreq` / `priority`
- 语义化 HTML：单 `h1`、`main`、`nav[aria-label]`、跳过导航链接
- 机型页正文针对「机型 + 关闭广告」长尾词组织，非模板堆砌

## GEO 设计

面向 AI 搜索与生成式引擎的可引用性：

- `robots.txt` 显式放行 GPTBot、OAI-SearchBot、ClaudeBot、PerplexityBot 等 12 个抓取器
- 每页以「结论先行 + 可核对的具体路径」组织，便于被直接摘录
- 机型页含明确的适用条件表（系统版本、构建号、脚本状态），可被引用为事实
- 关键操作给命令原文与还原方式，形成可验证闭环
- FAQ 用 `FAQPage` 结构化，问答成对，答案自包含（不依赖上下文）

## 持续产出内容

```bash
node scripts/new-guide.mjs "你的标题" 操作
```

写完后 `./scripts/deploy.sh` 发布。新机型：在 `src/data/models.ts` 的 `MODELS`
数组追加对象，构建时自动生成品牌页条目、详情页、sitemap 与结构化数据。

## 部署

见 [DEPLOY.md](./DEPLOY.md)。当前静态站已上线至服务器，DNS A 记录与 HTTPS
证书需要手动完成（域名的 NS 在 Cloudflare）。
