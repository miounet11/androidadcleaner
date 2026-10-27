#!/usr/bin/env node
// 新建一篇教程：node scripts/new-guide.mjs "标题" [分类]
import { writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const title = process.argv[2];
const category = process.argv[3] ?? '操作';

if (!title) {
  console.error('用法: node scripts/new-guide.mjs "教程标题" [入门|操作|机型|进阶|还原|排查]');
  process.exit(1);
}

const slug = process.argv[4] ?? title
  .toLowerCase()
  .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
  .replace(/^-|-$/g, '');

const file = join(root, 'src/content/guides', `${slug}.md`);
try {
  await access(file);
  console.error(`已存在: ${file}`);
  process.exit(1);
} catch {}

const today = new Date().toISOString().slice(0, 10);

const body = `---
title: ${title}
description: 一句话说明这篇教程解决什么问题，控制在 80 字以内。
category: ${category}
order: 99
updated: ${today}
readingTime: 5
keywords: []
featured: false
---

正文从这里开始。写清楚「为什么」再写「怎么做」，读者更愿意读完。

## 第一步

说明这一步的目的，再给操作路径。

## 常见问题

**问题描述**：答案。
`;

await writeFile(file, body, 'utf8');
console.log(`已创建: src/content/guides/${slug}.md`);
console.log(`预览: npm run dev → http://localhost:4321/guides/${slug}`);
