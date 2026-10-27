# 部署与域名绑定

站点已部署到 `23.95.243.52`，静态文件目录 `/var/www/androidadcleaner`。
nginx 配置文件在服务器 `/etc/nginx/sites-available/androidadcleaner.conf`，
仓库内副本见 `deploy/nginx.conf`。

## 当前状态

| 项目 | 状态 |
|---|---|
| 静态站部署 | 已完成，`/var/www/androidadcleaner` |
| nginx 站点配置 | 已完成，已 reload |
| HTTP 本地回环验证 | 全部路由 200（`Host: www.androidadcleaner.com`） |
| DNS A 记录 | **待配置**（域名的 NS 在 Cloudflare，当前无 A 记录） |
| HTTPS 证书 | 待 DNS 生效后签发 |

## 第一步：配置 DNS

域名 `androidadcleaner.com` 的 NS 是 `diana.ns.cloudflare.com` / `lakas.ns.cloudflare.com`，
需要到 Cloudflare 控制台添加两条 A 记录：

| 类型 | 名称 | 内容 | 代理状态 |
|---|---|---|---|
| A | `@` | `23.95.243.52` | 仅 DNS（灰色云朵） |
| A | `www` | `23.95.243.52` | 仅 DNS（灰色云朵） |

**首次签发证书时必须关闭 Cloudflare 代理（灰色云朵）**，否则 Let's Encrypt 的
HTTP-01 校验会被 Cloudflare 拦截。证书签发成功后再按需开启代理。

验证：

```bash
dig +short www.androidadcleaner.com A
# 期望输出 23.95.243.52
```

## 第二步：签发证书

DNS 生效后执行：

```bash
ssh root@23.95.243.52
certbot certonly --webroot -w /var/www/letsencrypt \
  -d androidadcleaner.com -d www.androidadcleaner.com \
  --email hello@androidadcleaner.com --agree-tos --no-eff-email
```

然后在 `deploy/nginx-ssl.conf` 里追加 443 段（或在服务器上把该文件的 server 块
合并进 `androidadcleaner.conf`），再：

```bash
nginx -t && systemctl reload nginx
```

证书自动续期由 certbot 的 systemd timer 负责，验证：

```bash
certbot renew --dry-run
```

## 第三步：日常发布

```bash
./scripts/deploy.sh
```

脚本按顺序执行：构建 → 类型检查 → 质量门禁 → rsync → IndexNow 推送 → 健康检查。

前四步是**硬门禁**，任一失败脚本立即中止（`set -euo pipefail`），线上保持上一个可用版本。
IndexNow 推送是有意豁免的软步骤：页面此时已经上线，推送只是加速被抓，
不该因为对方接口抖动就把一次成功发布判为失败。健康检查最后执行，失败返回非零。

### 质量门禁（棘轮）

`scripts/patrol.mjs` 测量五个数字并与 `patrol-baseline.json` 比较：

| 指标 | 当前基线 |
|---|---|
| 页面数 | 67 |
| 最大页面字节 | 68158（`models/index.html`） |
| 重复页面对数（Jaccard > 0.6） | 366 |
| 缺失 sitemap 条目 | 0 |
| 待补验证机型页 | 31 |

规则是**只许持平或变好**。数字变好时 `--update` 顺手压低底线，否则底线会一直落后于现实，
下次真退步就看不见了。退步时脚本非零退出，rsync 不会执行，线上不受影响。

基线是「今天的实际水平」，不是「理想水平」——`366` 对重复页面看着刺眼，
但它拦的是**变多**，不是存在本身。理想值要靠补真实机型差异去降，不是靠改数字。

### 线上巡检

```
40 3 * * * /opt/androidadcleaner/scripts/patrol-daily.sh # androidadcleaner-patrol
```

部署门禁只看部署那一刻。部署后站点仍可能变差——CDN 换了版本、rsync 漏文件、页面被手改坏。
这时状态码依然 200，健康检查全绿。`patrol-live.mjs` 每天抓真实页面重测一次，退步时通过
`/opt/stratat/scripts/notify.mjs` 发飞书告警（复用宿主机已有的 `NOTIFY_WEBHOOK`，
不另建通道，凭据不落盘到本仓库）。

它**故意不带 `--update`**：定时任务若把失败的那次测量写成新底线，第二天就会自动变绿，
而问题从没被人修过。底线只由通过了门禁的部署来压低。

日志：`/var/log/androidadcleaner-patrol.log`

### IndexNow 推送

`scripts/indexnow-submit.mjs` 在部署后把本次 URL 主动推给 Bing / Yandex 等。
密钥是公开的：`public/<key>.txt` 内容必须等于文件名里的 key，线上可访问即可通过校验。

```bash
node scripts/indexnow-submit.mjs --dry-run            # 试运行
node scripts/indexnow-submit.mjs --since 2026-10-27   # 只推该日期之后 lastmod 的页面
```

推送失败不阻断部署——页面已经上线，推送只是加速被抓。

### 类型检查依赖

`npm run check` 需要 `@astrojs/check` 与 `typescript`（已列入 devDependencies），
以及根目录的 `tsconfig.json`。缺 `tsconfig.json` 时内容集合类型不生效，
`getCollection()` 会退化成 `any`，所有箭头参数报 `ts(7006)`。

## macOS 签名与公证

## macOS 签名与公证

### 现有材料

| 材料 | 实际类型 | 能否用于站外 dmg |
|---|---|---|
| 证书 `distribution.cer` / `证书.p12` | **Apple Distribution**（App Store 分发） | 不能 |
| `androidadcleaner_mac2.provisionprofile` | Mac **App Store** 描述文件（`Platform=OSX`，无 `ProvisionedDevices`、无 `ProvisionsAllDevices`） | 不能 |
| 本机 `security find-identity -v -p codesigning` | 只有 `Apple Distribution: Kunshan Xingwang Shuke Network Technology Co., Ltd. (2B7JZ4N26U)` | 不能 |

实测证据：

```bash
# 用 Apple Distribution 签 app：本地校验通过
codesign --verify --deep --strict "安卓去广告.app"
# → valid on disk / satisfies its Designated Requirement

# 但 Gatekeeper 不认可
spctl -a -vvv -t exec "安卓去广告.app"
# → rejected（origin=Apple Distribution: ...）

# 用同一个身份签 pkg 直接被拒
productbuild --sign "Apple Distribution: ..." AC.pkg
# → An installer signing identity (not an application signing identity) is required
```

结论：**Apple Distribution 只能走 App Store 或 Ad Hoc**。要让用户从
`androidadcleaner.com` 直接下载 dmg 并双击打开，必须换成
**Developer ID Application** 证书并做公证（notarization）。这是两条不同的签名路径，
材料不能互相替代。

### 走站外 dmg 分发需要补的材料

1. Apple Developer 后台新建 **Developer ID Application** 证书（Certificates → + →
   Developer ID Application），下载后导入钥匙串。
2. 生成 App 专用密码（appleid.apple.com → 登录与安全 → App 专用密码），存公证凭据：

```bash
xcrun notarytool store-credentials "ac-notary" \
  --apple-id "你的 Apple ID" --team-id "2B7JZ4N26U" --password "App 专用密码"
```

3. 用现有 `gui/build_mac.sh` 打包签名并公证（脚本已支持该路径）：

```bash
SIGN_ID="Developer ID Application: Kunshan Xingwang Shuke Network Technology Co., Ltd. (2B7JZ4N26U)" \
NOTARY_PROFILE="ac-notary" \
  gui/build_mac.sh

ARCH=x86_64 SIGN_ID="Developer ID Application: ..." NOTARY_PROFILE="ac-notary" \
  gui/build_mac.sh
```

4. 验证产物：

```bash
codesign --verify --deep --strict "gui/dist/arm64/安卓去广告.app"
spctl -a -vvv -t install gui/dist/AndroidAdCleaner-*-mac-arm64.dmg
xcrun stapler validate gui/dist/AndroidAdCleaner-*-mac-arm64.dmg
```

三项分别要输出 `valid on disk`、`accepted` 和 `The validate action worked`。

### 当前线上状态

现有 dmg 都是 **adhoc 签名**（`flags=0x2(adhoc)`、`TeamIdentifier=not set`），
`spctl` 判定 `rejected`。下载页对这种情况的指引是让用户在「隐私与安全性」里点
「仍要打开」，这属于未签名分发的正常预期，不是 bug。

## 新增教程

```bash
node scripts/new-guide.mjs "教程标题" 操作
```

会生成带 frontmatter 的 Markdown 骨架，写入 `src/content/guides/`，
构建时自动生成列表与详情页、sitemap 条目和 Article 结构化数据。

## SEO / GEO 检查清单

每次发布后可用以下命令抽查：

```bash
# canonical 是否使用 www 且无 index.html
curl -s https://www.androidadcleaner.com/models/xiaomi/m154ff | grep -o 'rel="canonical" href="[^"]*"'

# 结构化数据条数
curl -s https://www.androidadcleaner.com/ | grep -c 'application/ld+json'

# sitemap
curl -s https://www.androidadcleaner.com/sitemap-0.xml | grep -c '<loc>'

# robots 中 AI 抓取器是否放行
curl -s https://www.androidadcleaner.com/robots.txt | grep -A1 GPTBot
```
