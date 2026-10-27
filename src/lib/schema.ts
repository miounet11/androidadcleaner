import { SITE } from '../consts';
import type { DeviceModel } from '../data/models';

export const organization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE.name,
  url: SITE.url,
  logo: `${SITE.url}/icon-512.png`,
  sameAs: [SITE.repo, SITE.toolRepo],
  description: SITE.description,
};

export const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  inLanguage: 'zh-CN',
  description: SITE.description,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE.url}/models?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const softwareApp = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Android 去广告',
  alternateName: 'Android Ad Cleaner',
  applicationCategory: 'UtilitiesApplication',
  applicationSubCategory: '设备管理',
  operatingSystem: 'macOS, Windows 10, Windows 11, Android',
  softwareVersion: SITE.latestVersion,
  datePublished: '2026-10-25',
  license: 'https://opensource.org/licenses/MIT',
  isAccessibleForFree: true,
  url: `${SITE.url}/download`,
  downloadUrl: `${SITE.url}/download`,
  softwareHelp: `${SITE.url}/guides`,
  codeRepository: SITE.toolRepo,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CNY',
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    '关闭国产安卓系统广告',
    '关闭热搜与资讯推荐',
    '按渠道关闭营销推送',
    '挂起系统广告组件',
    '检测并关闭快应用',
    '一键还原全部改动',
  ],
  description: SITE.description,
  author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
};

export function breadcrumb(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: new URL(item.url, SITE.url).href,
    })),
  };
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function howTo(
  name: string,
  description: string,
  steps: { name: string; text: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    totalTime: 'PT10M',
    tool: [
      { '@type': 'HowToTool', name: 'Windows 10/11 或 macOS 电脑' },
      { '@type': 'HowToTool', name: 'USB 数据线' },
      { '@type': 'HowToTool', name: '安卓手机（开启 USB 调试）' },
    ],
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function article(opts: {
  title: string;
  description: string;
  url: string;
  published: string;
  modified: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    inLanguage: 'zh-CN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': new URL(opts.url, SITE.url).href },
    datePublished: opts.published,
    dateModified: opts.modified,
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: { '@type': 'ImageObject', url: `${SITE.url}/icon-512.png`, width: 512, height: 512 },
    },
  };
}

export function deviceItemList(models: DeviceModel[], url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '适配机型列表',
    numberOfItems: models.length,
    itemListElement: models.map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: `${m.name}（${m.code}）去广告适配`,
        brand: { '@type': 'Brand', name: m.brand },
        description: m.note,
        url: new URL(`${url}#${m.code}`, SITE.url).href,
      },
    })),
  };
}

export function modelPage(model: DeviceModel, brandName: string) {
  const url = `${SITE.url}/models/${model.brand}/${model.code.toLowerCase()}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${model.name}（${model.code}）去广告教程：${model.os}`,
    description: model.note,
    inLanguage: 'zh-CN',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished: model.testedAt ?? '2026-10-20',
    dateModified: model.testedAt ?? '2026-10-20',
    about: {
      '@type': 'Product',
      name: model.name,
      model: model.code,
      brand: { '@type': 'Brand', name: brandName },
      operatingSystem: model.os,
    },
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url },
  };
}
