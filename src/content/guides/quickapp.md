---
title: 快应用是什么，怎么关
description: 广告里一点就跳进去的「快应用」免安装程序，是国产手机最容易被忽略的广告入口。识别方法、关闭命令和还原方式。
category: 进阶
order: 7
updated: 2026-10-26
readingTime: 5
keywords: ['快应用', 'quickapp', '免安装应用', '快应用广告', '快应用关闭']
---

很多人以为广告是浏览器弹的，其实点下去打开的是快应用 —— 一种不用安装、直接在系统里运行的轻应用。它有自己的商店、自己的推荐位，关掉 App 里所有开关也拦不住。

## 怎么判断是快应用

- 点广告后打开一个页面，**顶部没有浏览器地址栏**；
- 左上角有一个「×」而不是「←」，点 × 会直接回到桌面；
- 在「设置 → 应用」里找不到对应 App；
- 最近任务里显示的是一个白色图标加应用名的卡片。

## 检测

```bash
python3 tool/run.py -s <序列号> quickapp
```

输出会告诉你快应用中心是否存在、属于哪个厂商实现（小米的 `com.miui.hybrid`、OPPO 的 `com.nearme.instant.platform`、vivo 的 `com.vivo.hybrid` 等）。

## 关闭

```bash
python3 tool/run.py -s <序列号> quickapp off
```

执行后快应用入口被停用，广告点击会退化成打开浏览器或提示无法打开。已经装过的快应用数据不受影响。

小米设备还有一层：

```bash
adb shell settings put secure instant_apps_enabled 0
```

## 关了会失去什么

快应用本身是厂商提供的能力。关闭后：

- 广告跳转失效（这是目的）；
- 部分小程序式的功能（比如某些银行的免安装版）也无法打开，需要改用 App；
- 负一屏里以快应用形式提供的卡片可能不显示。

如果你经常用某个快应用服务，可以只关闭快应用的「推荐位」而不整体停用，见下方。

## 只关推荐、保留功能

部分实现支持只关闭推荐入口：

```bash
adb shell settings put secure quickapp_recommend_enabled 0
```

这条命令并非所有厂商都生效。执行后用 `quickapp` 只读检测确认状态。

## 还原

```bash
adb shell cmd quickapp enable
```

或使用工具：

```bash
python3 tool/run.py -s <序列号> restore --quickapp
```

## 常见问题

**检测不到快应用中心**：说明这台设备没有预装，或者已经被系统更新移除。不需要处理。

**关掉后广告还在**：广告来源不止快应用。继续查[系统广告组件](/guides/system-ad-package)和各 App 内的开关。

**关掉后某个功能打不开了**：用上面的还原命令恢复，再单独评估。快应用整体关闭和单个服务依赖是两回事。
