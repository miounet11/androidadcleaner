#!/usr/bin/env bash
# 线上质量巡检：每天对真实服务的页面跑一次棘轮比对。
#
#   /opt/androidadcleaner/scripts/patrol-daily.sh
#
# 为什么需要它：deploy.sh 里的门禁只在部署那一刻看页面。部署完成后站点仍可能悄悄变差
# ——CDN 缓存换了版本、rsync 漏了文件、某个页面被手工改坏。这时状态码依然 200，
# 健康检查全绿，但页面本身已经退步。没有任何东西会在部署之后再看一眼。
#
# 这里只报告、不改底线。`--update` 故意不在这里出现：定时任务若把失败的那次测量写成新底线，
# 第二天的运行就会自动变绿，而问题从没被人修过。底线只由人来跑、且通过了门禁的部署来压低。
#
# 退出码：0 不低于底线；1 退步；2 测量本身失败（抓不到页面等）。三者是不同的事实。
set -uo pipefail

ROOT="${ANDROIDADCLEANER_ROOT:-/opt/androidadcleaner}"
LOG=/var/log/androidadcleaner-patrol.log

# 先重定向再 cd：根目录缺失时也要留下日志并告警，否则 cron 里什么都不发生。
mkdir -p "$(dirname "$LOG")" 2>/dev/null
exec >>"$LOG" 2>&1
echo "=== $(date -Is) patrol start ==="

# 告警凭据来自宿主机 env 文件，绝不写进本脚本。
if [ -f /opt/stratat/.env ]; then
  set -a
  # shellcheck disable=SC1091
  . /opt/stratat/.env
  set +a
fi

if ! cd "$ROOT"; then
  echo "patrol: 根目录不存在：$ROOT" >&2
  node /opt/stratat/scripts/notify.mjs --stage androidadcleaner-patrol \
    --reason "androidadcleaner 巡检根目录不存在：$ROOT" || true
  exit 2
fi

node scripts/patrol-live.mjs
status=$?
echo "patrol-live exit=$status"

if [ "$status" -eq 0 ]; then
  exit 0
fi

# 复用宿主机已有的飞书告警，不另建通道。
raw=$(tail -20 "$LOG" 2>/dev/null)
if [ "$status" -eq 1 ]; then
  reason="androidadcleaner 线上质量相对底线退步"
else
  reason="androidadcleaner 线上巡检无法测量（exit=$status）"
fi
node /opt/stratat/scripts/notify.mjs --stage androidadcleaner-patrol --reason "$reason" --raw "$raw" || true

exit "$status"
