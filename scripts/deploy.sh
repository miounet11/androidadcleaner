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

# downloads/ 存的是安装包产物，不在 dist 里，必须排除在 --delete 之外
rsync -az --delete --exclude '.DS_Store' --exclude 'downloads/' dist/ "${USER}@${HOST}:${TARGET}/"

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
