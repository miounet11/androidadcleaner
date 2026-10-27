---
title: 系统广告组件：msa 与 opos.ads
description: com.miui.systemAdSolution、com.opos.ads 这些没有界面开关的系统广告包是什么，为什么要挂起加断网，以及怎么还原。
category: 进阶
order: 6
updated: 2026-10-26
readingTime: 6
keywords: ['msa', 'systemAdSolution', 'opos.ads', '系统广告组件', 'pm suspend']
---

有些广告没有对应的设置开关。它们由系统里的广告组件直接投放，你在设置里翻不到任何选项。这类组件需要用 adb 挂起。

## 常见组件

| 包名 | 厂商 | 作用 |
|---|---|---|
| `com.miui.systemAdSolution` | 小米 | msa 系统广告服务，多家系统 App 共用 |
| `com.miui.analytics` | 小米 | 统计上报，含广告归因 |
| `com.opos.ads` | OPPO | 广告 SDK 服务 |
| `com.heytap.mcs` | OPPO | 推送与营销通道 |
| `com.vivo.abe` | vivo | 行为分析，参与推荐 |
| `com.hihonor.id` | 荣耀 | 广告标识服务 |

## 为什么是「挂起」而不是卸载

```bash
adb shell pm suspend com.miui.systemAdSolution
```

`pm suspend` 让包进入挂起状态：不运行、不接收广播，但**没有删除**。系统更新、恢复出厂都不受影响，一条命令就能恢复：

```bash
adb shell pm unsuspend com.miui.systemAdSolution
```

工具明确不使用 `pm uninstall` 和 `pm disable-user`。卸载系统应用在部分厂商 ROM 上会导致开机循环，disable-user 在系统更新后可能残留问题。

## 为什么要配合断网

挂起只挡住包被主动调用。某些系统 App 启动时会尝试把 msa 拉起来 —— 这时候包会被重新激活。

所以小米的方案是：挂起 + 对 msa 断网。断网用系统自带的流量管理规则，重启后可能失效，需要重跑。工具在 `recipe` 里会检查并重建规则，完成后回读确认。

## 工具里怎么用

```bash
python3 tool/run.py -s <序列号> packages         # 只读：列出存在的广告组件
python3 tool/run.py -s <序列号> suspend          # 挂起检测到的组件
```

客户端里是「系统组件」卡片，勾选后执行。

## 副作用

功能 | 影响
---|---
系统设置里的广告开关 | 依然存在，但不再生效
应用商店的推广位 | 大多数消失
个性化推荐类内容 | 明显减少
系统更新 | 不受影响
推送消息 | 不受影响（推送走独立通道）
天气、日历 | 不受影响

已知的少数情况：部分老版本 ROM 上挂起 msa 后，应用商店的「应用更新」列表会变慢。这不影响使用，还原后恢复。

## 还原

```bash
python3 tool/run.py -s <序列号> restore --packages
```

从备份快照读取原本挂起的包，逐个 unsuspend。如果没做过备份，也可以用 `pm list packages -d` 查看哪些处于挂起状态。

## 不要在没备份的情况下批量挂起

有些包名字看起来像广告但实际承担系统功能。工具只处理内置白名单里的包，自己用 adb 手工挂起前请先确认包的作用。
