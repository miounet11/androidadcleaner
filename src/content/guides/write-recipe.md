---
title: 给新机型写脚本
description: 机型脚本（recipe）的结构、如何用录屏与只读检测定位入口、如何提交给社区，以及安全模式的判定规则。
category: 进阶
order: 10
updated: 2026-10-26
readingTime: 10
keywords: ['机型脚本', 'recipe 开发', '贡献代码', '自动化脚本']
---

一台新机型没有脚本时，最有效的帮助是有人录一份。这篇文章说明脚本长什么样、怎么调试。

## 脚本目录结构

```
recipes/xiaomi-M154FF/
├── recipe.py          # 主脚本
├── manifest.json      # 机型元数据
└── notes.md           # 实测记录
```

`manifest.json` 声明适用条件：

```json
{
  "brand": "xiaomi",
  "model": "M154FF",
  "display_id_prefix": "OS4.0",
  "android": "17",
  "tested_at": "2026-10-25",
  "status": "verified"
}
```

`display_id_prefix` 是关键字段：手机构建号不以它开头时，引擎会进入安全模式而不是强行执行。

## 脚本的基本单元

脚本由若干「段」（section）组成，每段处理一个入口：

```python
def section_store(ctx):
    """应用商店推广位"""
    ctx.open_app("com.xiaomi.market")
    ctx.find_click("我的")
    ctx.find_click("设置")
    ctx.set_switch("个性化服务", off=True)
```

引擎提供的操作：

| 方法 | 作用 |
|---|---|
| `open_app(pkg)` | 从桌面冷启动，避免复用到旧子页 |
| `find_click(text)` | 按可见文字点击，找不到返回失败而不是乱点 |
| `set_switch(name, off)` | 找到开关并拨到指定方向，自动识别反向开关 |
| `back_to_top()` | 回到首页，处理多层子页 |
| `verify(name, off)` | 回读确认，失败则该段不通过 |

## 关键约束

**不要盲点**。所有点击必须能定位到明确的文字或控件。定位失败时抛异常，让这一步失败并记录。

**不要关闭总开关**。总开关往往连带删除功能卡片，比如 OPPO 的「推荐服务」。

**不要同意任何协议**。遇到用户协议页，脚本应当点「取消」并跳过该段。

**必须能回读**。改动后要能再次读取到目标状态，读不到就当作未完成。

## 调试流程

1. 用 `check` 确认机型和构建号；
2. 用 `explore.py` 抓取当前页面的控件树：

```bash
python3 tool/explore.py -s <序列号> --dump-page
```

3. 手工在手机上走一遍，记录每一步的路径；
4. 写成段，每段单独跑：

```bash
python3 tool/run.py -s <序列号> recipe --only store
```

5. 全部跑通后跑整段，再用 `verify` 回读。

## 提交

1. Fork 仓库；
2. 新建 `recipes/<品牌>-<型号>/`；
3. 附上 `notes.md`：机型、构建号、实测日期、跳过了哪些段、为什么；
4. 提 PR，说明你在真机上跑过。

状态从 `pending` 开始。至少两人在真机上跑通、且回读通过，才会标为 `verified`。

## 提交时容易被打回的情况

- 没有 `notes.md`，看不出是否真机验证；
- 用了 `pm uninstall` 或 `pm disable-user`；
- 关闭了总开关导致功能缺失；
- 脚本在版本不匹配时仍然强行执行；
- 只写了「关闭个性化推荐」这种笼统描述，没有具体控件文字。

## 没有真机怎么办

可以只提交 `notes.md` 形式的手动清单 —— 路径经过核对也有价值。社区会有人认领设备验证。

见 [GitHub 仓库](https://github.com/miounet11/android-ad-cleaner) 的 `docs/04-给新机型写脚本.md`，里面有完整规范。
