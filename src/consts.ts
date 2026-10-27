export const SITE = {
  name: 'Android 去广告',
  domain: 'www.androidadcleaner.com',
  url: 'https://www.androidadcleaner.com',
  tagline: '国产安卓系统广告清理工具',
  description:
    '开源的安卓去广告工具：通过 adb 关闭国产手机系统里的广告、热搜、资讯推荐和营销推送。不 root、不刷机、不卸载系统应用，机型脚本覆盖小米、OPPO、vivo、荣耀、一加，可随时还原。',
  // 本站源码仓库（Astro 站点本身 + 质量门禁脚本），是本项目的公开主仓库。
  repo: 'https://github.com/miounet11/androidadcleaner',
  issues: 'https://github.com/miounet11/androidadcleaner/issues',
  // 桌面端与命令行工具的代码仓库，与站点是两回事：它派生自上游 android-ad-cleaner，
  // 安装包也在这里发布。站点上「源码」「下载与发布」必须指向它，指到站点仓库会 404。
  toolRepo: 'https://github.com/miounet11/android-ad-cleaner',
  releases: 'https://github.com/miounet11/android-ad-cleaner/releases',
  latestVersion: '0.2.3',
  latestDate: '2026-10-25',
  license: 'MIT',
  email: 'hello@androidadcleaner.com',
} as const;

export const NAV = [
  { label: '功能', href: '/features' },
  { label: '机型库', href: '/models' },
  { label: '使用教程', href: '/guides' },
  { label: '下载', href: '/download' },
  { label: '更新记录', href: '/changelog' },
  { label: '问答', href: '/faq' },
] as const;
