#!/usr/bin/env bash
# 部署到 23.95.243.52:/var/www/androidadcleaner
# 用法: ./scripts/deploy.sh [--skip-build]
set -euo pipefail

HOST="${DEPLOY_HOST:-23.95.243.52}"
USER="${DEPLOY_USER:-root}"
TARGET="${DEPLOY_PATH:-/var/www/androidadcleaner}"
DOMAIN="${DEPLOY_DOMAIN:-www.androidadcleaner.com}"
# 巡检工具目录，与静态站根目录 TARGET 是两个位置：基线是比对用的标尺，不是站点文件，
# 不能跟着 dist 一起发布，否则会通过 HTTP 暴露出去。
PATROL_DIR="${PATROL_PATH:-/opt/androidadcleaner}"

cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--skip-build" ]]; then
  echo "==> 构建"
  npm run build
fi

# 质量棘轮：今天的数字是底线，只许持平或变好。
# 退步（重复页变多、待补页变多、页面变大）时线上保持不动，
# 变好时顺手压低底线，否则底线会一直落后于现实、下次真退步就看不见了。
echo "==> 类型检查"
npm run check

echo "==> 质量门禁"
node scripts/patrol.mjs --update

# 部署前给线上树做快照。下面这条 rsync 带 --delete：本地 dist 少了一个文件，
# 线上就少一个，没有任何撤销手段。同主机上 stratat 与 cleanyourtv 都真出过
# 内容被覆盖丢失的事，就是因为当时没有这一步。
#
# 快照失败只警告不中止：备份是保险，不是发布的前置条件。放 /var/lib 而不是
# /var/www，避免被后续 rsync --delete 或 HTTP 直接访问到。
echo "==> 线上快照"
ssh -o BatchMode=yes "${USER}@${HOST}" "bash -s" <<SNAPSHOT || echo "WARN: 线上快照失败，继续部署"
set -u
SRC="${TARGET}"
DEST=/var/lib/androidadcleaner-snapshots
KEEP=10
[ -d "\$SRC" ] || { echo "no live tree at \$SRC — first deploy, nothing to snapshot"; exit 0; }
mkdir -p "\$DEST" || exit 1
STAMP=\$(date -u +%Y%m%dT%H%M%SZ)
# 排除 downloads/：142M 的安装包几乎不变，每份快照都复制一遍会白占 1.4G，
# 而 rsync --delete 根本毁不掉它（它不在 dist 里，且被 --exclude 保护）。
# 真正需要快照兜底的是站点内容——那才是 --delete 能一次删光的东西。
tar czf "\$DEST/\$STAMP.tar.gz" --exclude './downloads' -C "\$SRC" . 2>/dev/null || { echo "tar failed"; exit 1; }
echo "snapshot: \$DEST/\$STAMP.tar.gz (\$(du -h "\$DEST/\$STAMP.tar.gz" | cut -f1))"
ls -1 "\$DEST"/*.tar.gz 2>/dev/null | sort | head -n "-\$KEEP" | xargs -r rm -f
echo "kept: \$(ls -1 "\$DEST"/*.tar.gz 2>/dev/null | wc -l)/\$KEEP"
SNAPSHOT

# 原子切换：先整树同步到 ${TARGET}.next，全部传完再在服务器上 rename。
# 直接 rsync 到 ${TARGET} 时，传输过程中站点是半旧的——文件逐个替换，
# 中途访问会拿到新旧混杂的页面。rename 在同一文件系统内是原子的，
# nginx 要么看到旧树要么看到新树，没有中间态。
#
# downloads/ 存的是安装包产物，不在 dist 里，必须排除在 --delete 之外。
STAGE="${TARGET}.next"
ssh -o BatchMode=yes "${USER}@${HOST}" "rm -rf '${STAGE}' && mkdir -p '${STAGE}'"
rsync -az --delete --exclude '.DS_Store' --exclude 'downloads/' dist/ "${USER}@${HOST}:${STAGE}/"

# 安装包目录不在 dist 里，切换前必须从旧树接过来。
#
# 这里曾出过真事故：只写 `[ -d TARGET/downloads ] && cp`，一旦某次 TARGET 里
# 已经没有该目录，代码就静默跳过，缺失状态被一次次继承下去——142M 的四个
# 安装包在线上消失了，而下载页照常 200 地导流到 404 链接。
#
# 因此：旧树有就必须接上；旧树没有而快照里有，就从快照恢复；两边都没有
# 且该站曾经发布过（快照存在即证），直接失败，不发布一个下载全 404 的站点。
echo "==> 安装包"
ssh -o BatchMode=yes "${USER}@${HOST}" "bash -s" <<PACKAGES
set -eu
STAGE="${STAGE}"
TARGET="${TARGET}"
SNAPDIR=/var/lib/androidadcleaner-snapshots
PKGDIR=/var/lib/androidadcleaner-packages

if [ -d "\$TARGET/downloads" ]; then
  cp -a "\$TARGET/downloads" "\$STAGE/downloads"
  echo "downloads: inherited from live tree (\$(du -sh "\$STAGE/downloads" | cut -f1), \$(ls -1 "\$STAGE/downloads" | wc -l) files)"
elif [ -d "\$PKGDIR" ]; then
  # 旧树没有，从持久副本捞回来。安装包不进站点快照（体积大且几乎不变），
  # 单独在这里留一份，专门兜「线上被删」这一种情况。
  cp -a "\$PKGDIR" "\$STAGE/downloads"
  echo "downloads: recovered from \$PKGDIR (\$(du -sh "\$STAGE/downloads" | cut -f1), \$(ls -1 "\$STAGE/downloads" | wc -l) files)"
else
  echo "FATAL: 线上树与持久副本都没有 downloads/——不发布下载全 404 的站点" >&2
  exit 1
fi

# 持久副本只在缺失时补齐。安装包由本地发版流程维护，这里不覆盖已有副本，
# 避免把运维手工放进去的新版本冲掉。
if [ -d "\$STAGE/downloads" ] && [ ! -d "\$PKGDIR" ]; then
  mkdir -p "\$PKGDIR"
  cp -a "\$STAGE/downloads/." "\$PKGDIR/"
  echo "packages: seeded \$PKGDIR (\$(ls -1 "\$PKGDIR" | wc -l) files)"
fi
PACKAGES

# 两步 rename：旧树先挪开，新树再就位。第二个 mv 是瞬时操作。
ssh -o BatchMode=yes "${USER}@${HOST}" "set -e; rm -rf '${TARGET}.prev'; mv '${TARGET}' '${TARGET}.prev' 2>/dev/null || true; mv '${STAGE}' '${TARGET}'; echo 'swap: ${TARGET}.next -> ${TARGET} (prev kept as .prev)'"

# 巡检脚本与基线必须跟着代码走。上面的 --update 可能刚把基线压低（数字变好时），
# 若服务器副本不更新，每日巡检就会拿放宽的旧底线比对——底线越用越松，
# 直到某天真的退步了也显示绿色。脚本同理：改了测量逻辑却让线上跑旧版，
# 测出来的数字就不再是仓库里的那套口径。这条同步让棘轮在线上也真的只进不退。
scp -q patrol-baseline.json "${USER}@${HOST}:${PATROL_DIR}/patrol-baseline.json"
scp -q scripts/patrol-live.mjs "${USER}@${HOST}:${PATROL_DIR}/scripts/patrol-live.mjs"
scp -q scripts/patrol-daily.sh "${USER}@${HOST}:${PATROL_DIR}/scripts/patrol-daily.sh"
ssh -o BatchMode=yes "${USER}@${HOST}" "chmod 755 ${PATROL_DIR}/scripts/patrol-daily.sh"

# 主动告知搜索引擎哪些 URL 变了。失败不阻断部署：页面已经上线，
# 推送只是加速被抓，不该因为对方接口抖动就把一次成功发布判为失败。
echo "==> IndexNow 推送"
node scripts/indexnow-submit.mjs || echo "WARN: IndexNow 推送失败，页面已上线，不影响部署"

echo "==> 健康检查（HTTPS 回源）"
ssh -o BatchMode=yes "${USER}@${HOST}" bash -s <<EOF
set -e
for p in / /models /guides /download /faq /sitemap-index.xml /robots.txt; do
  code=\$(curl -sk -o /dev/null -w "%{http_code}" -H "Host: ${DOMAIN}" https://127.0.0.1\$p)
  printf '%s  %s\n' "\$code" "\$p"
  [ "\$code" = "200" ] || exit 1
done

# HTTP 必须整站 301 到 https://www
redir=\$(curl -s -o /dev/null -w "%{http_code}:%{redirect_url}" -H "Host: ${DOMAIN}" http://127.0.0.1/)
printf '%s  http->https\n' "\$redir"
[ "\$redir" = "301:https://${DOMAIN}/" ] || exit 1

echo "OK 全部路由 200，HTTP 已跳转 HTTPS"
EOF
