import type { Locale } from './config';

/**
 * 界面文案字典。
 *
 * 英文不是中文的逐字直译：搜索引擎对机器直译的识别很成熟，
 * 而且这类内容在英文市场本来就有更强的竞品。这里按英文用户的提问方式重写，
 * 例如中文写「国产手机」，英文写品牌名，因为英文用户不会用那个词搜索。
 */
export const UI = {
  'zh-CN': {
    nav: {
      features: '功能',
      models: '机型库',
      guides: '使用教程',
      download: '下载',
      changelog: '更新记录',
      faq: '问答',
    },
    siteName: '安卓去广告',
    tagline: '国产安卓系统广告清理工具',
    footer: {
      community: '社区',
      source: 'GitHub 源码',
      releases: '下载与发布',
      issues: '问题反馈',
      contribute: '提交机型脚本',
      about: '关于与免责',
      friendLinks: '友情链接',
    },
    switchLanguage: '切换到 English',
  },
  en: {
    nav: {
      features: 'Features',
      models: 'Devices',
      guides: 'Guides',
      download: 'Download',
      changelog: 'Changelog',
      faq: 'FAQ',
    },
    siteName: 'Android Ad Cleaner',
    tagline: 'Remove system ads and push notifications from Chinese Android phones',
    footer: {
      community: 'Community',
      source: 'Source code',
      releases: 'Releases',
      issues: 'Report an issue',
      contribute: 'Contribute a recipe',
      about: 'About & disclaimer',
      friendLinks: 'Links',
    },
    switchLanguage: 'Switch to 简体中文',
  },
} as const satisfies Record<Locale, unknown>;

export type UIStrings = (typeof UI)['zh-CN'];

export function useTranslations(locale: Locale): UIStrings {
  return UI[locale] as UIStrings;
}
