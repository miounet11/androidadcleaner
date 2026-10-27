/**
 * 站点语言配置。
 *
 * 只有 zh-CN 是完整翻译的；en 目前覆盖首页与下载页等主要入口。
 * 没翻译的页面不生成 en 版本，也不要给它 hreflang 指向——指向一个
 * 内容不存在的 URL，比不给 hreflang 更糟，搜索引擎会判为软 404。
 */
export const LOCALES = ['zh-CN', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** 默认语言不带前缀，即 `/` 是中文，`/en/` 是英文。 */
export const DEFAULT_LOCALE: Locale = 'zh-CN';

export const LOCALE_META: Record<Locale, {
  /** <html lang>，用 BCP 47 标准写法。 */
  htmlLang: string;
  /** og:locale，Open Graph 用下划线分隔。 */
  ogLocale: string;
  /** 语言切换器显示名。 */
  label: string;
  /** 该语言在 sitemap 里的 URL 前缀。默认语言为空串。 */
  prefix: string;
}> = {
  'zh-CN': { htmlLang: 'zh-CN', ogLocale: 'zh_CN', label: '简体中文', prefix: '' },
  en: { htmlLang: 'en', ogLocale: 'en_US', label: 'English', prefix: '/en' },
};

/**
 * 已翻译的路径白名单（不含语言前缀）。
 *
 * 只有列在这里的路径才会生成非默认语言版本。加语言前必须先加路由，
 * 否则导航会指向不存在的页面——那是 404，比不给多语言更糟。
 */
export const TRANSLATED_PATHS: ReadonlySet<string> = new Set(['/']);

/** 去掉结尾斜杠；`/` 保持为 `/`，供查表比对。 */
function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

export function hasTranslation(path: string, locale: Locale): boolean {
  if (locale === DEFAULT_LOCALE) return true;
  return TRANSLATED_PATHS.has(normalizePath(path));
}

/**
 * 只在目标页确有译文时才加语言前缀，否则退回默认语言。
 * 站内链接一律用它生成；直接拼前缀会在未翻译页上产出 404 链接。
 */
export function localizePathIfTranslated(path: string, locale: Locale): string {
  return hasTranslation(path, locale)
    ? localizePath(path, locale)
    : localizePath(path, DEFAULT_LOCALE);
}

/** 给默认语言的路径加上语言前缀。`/` → `/en/` 而不是 `/en`。 */
export function localizePath(path: string, locale: Locale): string {
  const prefix = LOCALE_META[locale].prefix;
  if (!prefix) return path;
  if (path === '/' || path === '') return `${prefix}/`;
  return `${prefix}${path}`;
}

/**
 * 当前路径属于哪个语言。用于语言切换器保持同一页面。
 * 判断依据是前缀段，不能只看 startsWith('/en')，否则 /energy 这类路径会误判。
 */
export function localeFromPath(pathname: string): Locale {
  for (const locale of LOCALES) {
    const { prefix } = LOCALE_META[locale];
    if (!prefix) continue;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return locale;
  }
  return DEFAULT_LOCALE;
}

/** 去掉语言前缀，得到语言无关的规范路径。 */
export function stripLocale(pathname: string): string {
  const locale = localeFromPath(pathname);
  const { prefix } = LOCALE_META[locale];
  if (!prefix) return pathname;
  const rest = pathname.slice(prefix.length);
  return rest === '' ? '/' : rest;
}
