---
title: 读屏失败与常见报错排查
description: 工具执行时提示「无法读取页面」「ui-check 失败」时的排查顺序，含 GKD、自动记账、Shizuku 等自动化工具的冲突处理。
category: 排查
order: 8
updated: 2026-10-26
readingTime: 8
keywords: ['读屏失败', 'adb 报错', 'UiAutomation', 'GKD 冲突', '自动化冲突']
---

工具点击开关需要读取屏幕内容（UiAutomation）。如果读不到，它会停下来并报告，而不是盲点。下面按出现频率排排查顺序。

## 第一步：先跑 ui-check

```bash
python3 tool/run.py -s <序列号> ui-check
```

它只检查「能否连上、页面能否读取」，不点击任何开关、不输出页面内容。限时 3 秒。

客户端里对应「检查读屏连接」按钮。

## 第二步：看具体报错

| 报错 | 含义 | 处理 |
|---|---|---|
| `UiAutomation not connected` | 读屏服务没能启动 | 见下方冲突排查 |
| `device offline` | 线松动或调试授权失效 | 重插、重新授权 |
| `no devices found` | adb 没识别到设备 | 换线、换 USB 口、`adb kill-server` |
| `permission denied` | 安全设置未开启 | 小米开「USB 调试（安全设置）」 |
| 页面读取到空白 | App 还没渲染完 | 工具会等最多 8 秒，超时则跳过该步 |

## 第三步：排查自动化工具冲突

这是最常见的根因。以下工具同样占用 UiAutomation 或无障碍通道：

- **GKD**（跳广告）
- **自动记账**（如钱迹、随手记的自动记账）
- **Shizuku** 相关功能
- 各类自动点击器、手势工具

处理方式：**临时停用其中一个**再重试，而不是全部关掉。

先关 GKD，跑 `ui-check`；不行再换成关闭自动记账，跑 `ui-check`。这样才能确定是哪个工具占用。

> 工具不会自动关闭无障碍服务、不会强停其他应用、不会重启手机。这些动作需要你自己决定。

## 第四步：不用读屏也能做的事

即使读屏不可用，以下命令仍然工作：

```bash
python3 tool/run.py -s <序列号> channels --apply   # 通知渠道按包处理，不读屏
python3 tool/run.py -s <序列号> suspend            # 挂起广告组件，不读屏
```

它们操作的是包和渠道，不需要读屏幕。App 内的开关（商店推广位、浏览器设置）才需要读屏。

## 第五步：设备侧限制

- 部分企业 / 学校设备由 MDM 管理，禁用了 UiAutomation，无法绕过；
- 部分定制 ROM（如运营商的定制版）移除了无障碍接口；
- Android 模拟器上功能通常正常，但个别厂商 App 在模拟器里不会渲染真实页面。

## 收集诊断

客户端失败时提供「复制完整诊断」，包含：

- 首个 `Exception` / `Caused by` 与完整堆栈；
- HyperOS 版本等系统信息；
- 序列号与用户目录已脱敏。

命令行对应日志在数据目录的 `logs/last-error.txt`。

提 issue 时贴完整诊断比截图末尾几行有用得多。见[问题反馈](/guides/report-issue)。

## 仍然不行

如果 `ui-check` 能通过但某个具体步骤失败，通常是那个版本的页面结构变了。这种情况：

1. 记下失败的步骤名；
2. 用同品牌[手动清单](/guides/manual-checklist)完成这一步；
3. 提 issue 说明机型与构建号，帮助后续补充脚本。
