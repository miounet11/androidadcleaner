export type SupportStatus =
  | 'verified'
  | 'paths-tested'
  | 'pending'
  | 'reference';

export interface DeviceModel {
  code: string;
  name: string;
  brand: string;
  os: string;
  android: string;
  status: SupportStatus;
  script: boolean;
  channels?: number;
  testedAt?: string;
  note: string;
  highlights: string[];
}

export interface Brand {
  slug: string;
  name: string;
  en: string;
  os: string;
  osName: string;
  color: string;
  intro: string;
  adSurfaces: { name: string; path: string; action: string }[];
  pitfalls: { title: string; detail: string }[];
}

export const STATUS_META: Record<
  SupportStatus,
  { label: string; short: string; tone: string; desc: string }
> = {
  verified: {
    label: '实测通过',
    short: '实测',
    tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200',
    desc: '在真实设备上完整跑通机型脚本，关键开关已回读确认。',
  },
  'paths-tested': {
    label: '路径实测',
    short: '路径',
    tone: 'text-brand-700 bg-brand-50 ring-brand-200',
    desc: '设置路径已在真机上逐项核对，自动化整段执行仍待复测。',
  },
  pending: {
    label: '待验证',
    short: '待验',
    tone: 'text-amber-700 bg-amber-50 ring-amber-200',
    desc: '脚本或清单已补充，等待对应机型的真实设备验证。',
  },
  reference: {
    label: '同系参考',
    short: '参考',
    tone: 'text-ink-600 bg-ink-100 ring-ink-200',
    desc: '与本品牌已实测机型同系统底包，入口结构相近，可参考同系清单操作。',
  },
};

export const BRANDS: Brand[] = [
  {
    slug: 'xiaomi',
    name: '小米 / Redmi / POCO',
    en: 'Xiaomi',
    os: 'HyperOS',
    osName: 'HyperOS 4',
    color: '#ff6900',
    intro:
      '小米的系统广告集中在系统广告服务（msa）、应用商店、浏览器、全局搜索、负一屏和天气日历。HyperOS 4 起部分入口层级有调整，新老版本需要分别处理。',
    adSurfaces: [
      { name: '系统广告服务 msa', path: '设置 → 隐私与安全 → 更多安全设置 → 广告服务', action: '关闭个性化广告推荐，打开「限制广告跟踪」' },
      { name: '应用商店', path: '应用商店 → 我的 → 右上齿轮', action: '关闭个性化服务、模式切换为极简、关闭新手帮助' },
      { name: '手机管家', path: '手机管家 → 右上齿轮', action: '关闭个性化推荐、垃圾清理推荐内容' },
      { name: '下载管理', path: '下载管理 → 更多 → 设置 → 信息流设置', action: '关闭资源推荐、热榜推荐' },
      { name: '主题', path: '主题 → 我的 → 右上齿轮', action: '关闭每次联网通知、个性化推荐' },
      { name: '浏览器', path: '浏览器 → 我的 → 齿轮 → 隐私和安全', action: '关闭个性化内容推荐、个性化广告推荐' },
      { name: '全局搜索', path: '桌面下滑 → 搜索页右上齿轮', action: '关闭搜索提示词、应用推荐、热搜榜单' },
      { name: '负一屏', path: '桌面左滑 → 设置', action: '关闭推荐卡片、热门活动、个性化推荐' },
      { name: '天气 / 日历', path: '天气、日历 → 设置 → 用户体验计划', action: '关闭内容推广、个性化推荐，保留天气预警' },
    ],
    pitfalls: [
      { title: 'msa 只挂起拦不住', detail: '系统 App 启动时会把 com.miui.systemAdSolution 拉起来，需要同时断网。重启后断网规则可能失效，要重跑。' },
      { title: '「限制广告跟踪」是反的', detail: '这类开关要打开才是保护。引擎的 p.off() 会自动识别并拨到「开」。' },
      { title: '渠道 ID 带竖线', detail: '小米的通知渠道 id 形如 mipush|包名|数字，按渠道关闭时不要动父开关。' },
      { title: '带背屏机型截图报多屏', detail: 'screencap 需要加 -d <主屏 display id>，脚本已处理。' },
    ],
  },
  {
    slug: 'oppo',
    name: 'OPPO / 一加 / realme',
    en: 'OPPO',
    os: 'ColorOS',
    osName: 'ColorOS 16 / 17',
    color: '#0aa344',
    intro:
      'OPPO 系的推广位大量集中在软件商店的「服务管理」和负一屏的「推荐服务」。ColorOS 的广告跟踪是按应用逐个开关，没有总开关。',
    adSurfaces: [
      { name: '系统广告跟踪', path: '设置 → 隐私 → 设备标识与广告 → 广告跟踪', action: '逐个关闭，无总开关，新装 App 需回来再关' },
      { name: '负一屏（速览）', path: '桌面左滑 → 左上头像 → 设置', action: '关闭搜索框提示词、轮播推荐、热点资讯' },
      { name: '下拉搜索', path: '桌面中间下滑 → 搜索页设置', action: '关闭热搜、推荐卡片、个性化推荐' },
      { name: '软件商店', path: '软件商店 → 我的 → 设置 → 服务管理', action: '关闭轮播、开屏、悬浮活动、签到福利' },
      { name: '浏览器', path: '浏览器 → 我的 → 设置', action: '关闭资讯推荐、个性化内容' },
    ],
    pitfalls: [
      { title: '推荐服务总开关不能关', detail: '负一屏的「推荐服务」总开关关掉会连带删除天气、步数、清理卡片。只关子项。' },
      { title: '广告跟踪按 App 计数', detail: '手机可能上百个条目，滚动到「更多」分组才看得到「设备标识与广告」。' },
      { title: '商店推广位跨页', detail: 'ColorOS 16 的商店推广位分布在多个子页，需要联网后再关闭并跨页回读。' },
    ],
  },
  {
    slug: 'vivo',
    name: 'vivo / iQOO',
    en: 'vivo',
    os: 'OriginOS',
    osName: 'OriginOS 6',
    color: '#415fff',
    intro:
      'vivo 的广告入口分布在系统设置的「广告与隐私」、负一屏、全局搜索和浏览器。快应用是 vivo 系最容易被忽略的广告入口。',
    adSurfaces: [
      { name: '广告与隐私', path: '设置 → 安全 → 更多安全设置 → 广告与隐私', action: '关闭个性化广告、个性化推荐、智能推荐服务' },
      { name: '负一屏', path: '桌面左滑 → 右上齿轮 → 更多设置 → 个性化推荐', action: '关闭服务推荐、资讯推荐、内容精选、热点资讯' },
      { name: '全局搜索', path: '设置 → 系统管理与升级 → 全局搜索', action: '关闭搜索框推荐词、推荐卡片、热门搜索、广告个性化' },
      { name: '快应用', path: 'adb shell quickapp', action: '检测快应用中心，quickapp off 关闭' },
    ],
    pitfalls: [
      { title: '便捷生活推荐服务别关', detail: '那 10 个图标（扫码、手电筒、计算器等）靠它补位，关掉整块变空。' },
      { title: '部分页面会被跳过', detail: '通知渠道能否安全关闭取决于系统页面和权限，脚本遇到不明确的页面会跳过而不是乱点。' },
    ],
  },
  {
    slug: 'honor',
    name: '荣耀',
    en: 'HONOR',
    os: 'MagicOS',
    osName: 'MagicOS 10',
    color: '#0a6cff',
    intro:
      '荣耀的广告主要在 YOYO 建议、下拉搜索和负一屏。广告与隐私页需要先「显示系统程序」才能看到全部应用的广告标识读取开关。',
    adSurfaces: [
      { name: '广告与隐私', path: '设置 → 搜索「广告」→ 广告与隐私', action: '右上 ⋮ → 显示系统程序 → 全部关闭；关闭智能推荐服务' },
      { name: 'YOYO 建议', path: '设置 → 搜索「新闻资讯」', action: '关闭新闻资讯' },
      { name: '下拉搜索', path: '桌面下滑 → 更多 → 设置', action: '关闭热搜榜、热搜词推荐、个性化管理' },
      { name: '负一屏', path: '桌面左滑 → 头像 → 设置', action: '关闭推荐卡片与资讯' },
    ],
    pitfalls: [
      { title: '广告标识藏在系统程序里', detail: '默认列表只显示用户应用，需要切到「显示系统程序」再全关。' },
      { title: '截图越界', detail: '荣耀某些机型的截图接口坐标越界，引擎已做裁剪保护。' },
    ],
  },
  {
    slug: 'huawei',
    name: '华为',
    en: 'HUAWEI',
    os: 'HarmonyOS',
    osName: 'HarmonyOS 4 / 5',
    color: '#cf0a2c',
    intro:
      '华为的 HarmonyOS 4（基于 AOSP）设备可通过 adb 处理部分系统广告入口。原生鸿蒙 NEXT 使用 HDC 而非 adb，当前工具不支持。',
    adSurfaces: [
      { name: '广告与隐私', path: '设置 → 隐私 → 广告与隐私', action: '关闭个性化广告、智能推荐服务' },
      { name: '应用市场', path: '应用市场 → 我的 → 设置', action: '关闭个性化推荐、内容推荐' },
      { name: '浏览器', path: '浏览器 → 我的 → 设置', action: '关闭资讯推荐、个性化内容' },
    ],
    pitfalls: [
      { title: '仅限 HarmonyOS 4', detail: 'HarmonyOS NEXT（5.0 起）不走 adb，工具无法连接，不要在 NEXT 设备上尝试。' },
      { title: '型号版本差异大', detail: '同一机型不同 EMUI / HarmonyOS 小版本，设置层级会变化，建议先只读检测。' },
    ],
  },
  {
    slug: 'samsung',
    name: '三星',
    en: 'Samsung',
    os: 'One UI',
    osName: 'One UI 6 / 7',
    color: '#1428a0',
    intro:
      '三星国行的系统广告主要集中在三星应用商店、三星浏览器和 Bixby 主页。One UI 的「自定义服务」是核心开关。',
    adSurfaces: [
      { name: '自定义服务', path: '设置 → 隐私 → 自定义服务', action: '关闭个性化推荐与营销信息' },
      { name: '三星应用商店', path: '应用商店 → 菜单 → 设置', action: '关闭个性化推荐、促销通知' },
      { name: '三星浏览器', path: '浏览器 → 设置 → 隐私', action: '关闭个性化内容与广告' },
    ],
    pitfalls: [
      { title: '国行与港版差异', detail: '国行机型广告更多，港版 / 国际版入口更少，操作前先确认版本。' },
      { title: 'Knox 与安全策略', detail: '部分企业设备会限制 adb 调试，需要先确认开发者选项可用。' },
    ],
  },
  {
    slug: 'realme',
    name: 'realme',
    en: 'realme',
    os: 'realme UI',
    osName: 'realme UI 6',
    color: '#f7d000',
    intro:
      'realme UI 与 ColorOS 同源，推广位结构与 OPPO 高度接近，多数场景可直接参考 OPPO 清单。',
    adSurfaces: [
      { name: '广告跟踪', path: '设置 → 隐私 → 设备标识与广告', action: '逐个关闭广告跟踪' },
      { name: '负一屏', path: '桌面左滑 → 设置', action: '关闭推荐服务子项与热点资讯' },
      { name: '软件商店', path: '软件商店 → 我的 → 设置', action: '关闭服务管理里的推广位' },
    ],
    pitfalls: [
      { title: '与 ColorOS 同源但入口改名', detail: '推荐直接参考 OPPO 清单，遇到名称对不上就跳过，不要盲点。' },
    ],
  },
];

export const MODELS: DeviceModel[] = [
  // ── 小米 ──
  {
    code: 'M154FF',
    name: 'Xiaomi 18 Pro Max',
    brand: 'xiaomi',
    os: 'HyperOS OS4.0.24',
    android: 'Android 17',
    status: 'verified',
    script: true,
    testedAt: '2026-10-25',
    note: '九段机型脚本在真机重跑通过，覆盖系统广告、商店、浏览器、搜索、负一屏、天气日历与 msa 挂起。',
    highlights: ['九段脚本全部通过', 'msa 挂起 + 断网已回读', '天气 / 日历内容推广已验证'],
  },
  {
    code: '2608BPX34C',
    name: 'Xiaomi 18 Fold',
    brand: 'xiaomi',
    os: 'CP2A.260605.016',
    android: 'Android 17',
    status: 'paths-tested',
    script: true,
    testedAt: '2026-10-24',
    note: '社区实测路径，与 18 Pro Max 同底包，App 版本不同导致入口有差异，脚本已兼容新旧两套入口。',
    highlights: ['社区实测路径', '新旧入口双兼容', '折叠屏截图需指定主屏'],
  },
  {
    code: 'umi',
    name: 'Xiaomi 10',
    brand: 'xiaomi',
    os: 'OS1.0.7.0（Android 13）',
    android: 'Android 13',
    status: 'pending',
    script: false,
    note: '社区提供了旧版路径。浏览器顶部设置图标可能没有 clickable 标记，热榜子页会横屏，整段仍待该机复测。',
    highlights: ['旧版路径来自社区', '读屏尺寸已修正', '待真机复测'],
  },
  {
    code: 'M2102K1C',
    name: 'Xiaomi 11 / Redmi K40 系列',
    brand: 'xiaomi',
    os: 'HyperOS 1.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '与已实测机型同属 HyperOS，可参考小米 HyperOS 手动清单，入口名称随小版本变化。',
    highlights: ['同系参考清单', '建议先运行只读检测'],
  },
  {
    code: '23113RKC6C',
    name: 'Redmi K60',
    brand: 'xiaomi',
    os: 'HyperOS',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '天气「用户体验计划」入口来自社区反馈，结构与已实测机型一致。',
    highlights: ['社区反馈路径', '参考小米清单'],
  },
  {
    code: 'POCO-F6',
    name: 'POCO F6 / F6 Pro',
    brand: 'xiaomi',
    os: 'HyperOS',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'POCO 与 Redmi 结构相近，无专用脚本时客户端可借用小米清单走安全模式。',
    highlights: ['Redmi 同源结构', '安全模式执行'],
  },
  // ── OPPO ──
  {
    code: 'PLP120',
    name: 'OPPO Find N6',
    brand: 'oppo',
    os: 'ColorOS 16.0.9',
    android: 'Android 15',
    status: 'paths-tested',
    script: true,
    testedAt: '2026-10-23',
    note: '路径逐项实测，机型脚本已存在，整段自动执行待复测。商店推广位与广告跟踪是重点。',
    highlights: ['30 个营销渠道已梳理', '商店服务管理推广位已验证', '整段待复测'],
  },
  {
    code: 'PMX110',
    name: 'OPPO Find X10 Pro Max',
    brand: 'oppo',
    os: 'ColorOS 17',
    android: 'Android 16',
    status: 'paths-tested',
    script: false,
    testedAt: '2026-10-22',
    note: '手动清单路径已实测，暂无专用机型脚本，可按清单手动操作或借用 Find N6 脚本走安全模式。',
    highlights: ['ColorOS 17 路径实测', '手动清单完整', '暂无专用脚本'],
  },
  {
    code: 'PMA120',
    name: 'OPPO Find X9 Ultra',
    brand: 'oppo',
    os: 'ColorOS 16.0.10',
    android: 'Android 15',
    status: 'pending',
    script: false,
    note: '页面结构与 Find N6 不同，专用脚本待补；营销通知渠道已梳理 27 个。',
    highlights: ['27 个渠道已梳理', '页面结构与 N6 不同', '专用脚本待补'],
  },
  {
    code: 'PHN110',
    name: 'OPPO Find N3 典藏版',
    brand: 'oppo',
    os: 'ColorOS 16.0.5',
    android: 'Android 15',
    status: 'pending',
    script: false,
    note: '手动清单部分完成，营销通知 27 个渠道已梳理，专用脚本待补。',
    highlights: ['27 个渠道已梳理', '清单部分完成'],
  },
  {
    code: 'PJA110',
    name: '一加 Ace 2 Pro',
    brand: 'oppo',
    os: 'ColorOS 14.0.0.812',
    android: 'Android 14',
    status: 'verified',
    script: true,
    testedAt: '2026-10-25',
    note: '真机完成操作与回读：3 项个性化关闭、6 项商店推广位关闭并跨页回读，23 个营销渠道通过。',
    highlights: ['23 个渠道关闭并回读', '付款 / 直播渠道已排除', '四段脚本实测'],
  },
  {
    code: 'realme-GT7',
    name: 'realme GT7 Pro',
    brand: 'realme',
    os: 'realme UI 6',
    android: 'Android 15',
    status: 'reference',
    script: false,
    note: 'realme UI 与 ColorOS 同源，参考 OPPO 清单操作，入口名称可能不同。',
    highlights: ['ColorOS 同源', '参考 OPPO 清单'],
  },
  // ── vivo ──
  {
    code: 'V2547DA',
    name: 'vivo X300 Ultra',
    brand: 'vivo',
    os: 'OriginOS 6',
    android: 'Android 16',
    status: 'pending',
    script: true,
    testedAt: '2026-10-22',
    note: '机型脚本已补充，整段自动执行仍待真机验证；V2547A 也会匹配，版本不同时走安全模式。',
    highlights: ['专用脚本已提交', '快应用检测已支持', '整段待真机验证'],
  },
  {
    code: 'iQOO-13',
    name: 'iQOO 13 / Neo10',
    brand: 'vivo',
    os: 'OriginOS 6',
    android: 'Android 15',
    status: 'reference',
    script: false,
    note: 'iQOO 结构与 vivo 相近，可参考 OriginOS 手动清单。',
    highlights: ['OriginOS 同源', '参考 vivo 清单'],
  },
  // ── 荣耀 ──
  {
    code: 'PNM-AN10',
    name: '荣耀 Magic7 Pro',
    brand: 'honor',
    os: 'MagicOS 10',
    android: 'Android 15',
    status: 'verified',
    script: true,
    testedAt: '2026-10-23',
    note: '机型脚本重跑约 4 分钟，26 个营销通知渠道关闭，手动清单完整。',
    highlights: ['重跑 4 分钟通过', '26 个渠道已关闭', '清单完整'],
  },
  // ── 华为 ──
  {
    code: 'ALN-AL00',
    name: '华为 Mate 60 Pro',
    brand: 'huawei',
    os: 'HarmonyOS 4.2',
    android: 'AOSP 12',
    status: 'reference',
    script: false,
    note: 'HarmonyOS 4 基于 AOSP，adb 可用，可参考华为清单操作。原生鸿蒙 NEXT 不支持。',
    highlights: ['adb 可用', 'NEXT 不支持'],
  },
  {
    code: 'BVL-AN00',
    name: '荣耀 / 华为 Mate 70 系列',
    brand: 'huawei',
    os: 'HarmonyOS 5 / NEXT',
    android: '—',
    status: 'reference',
    script: false,
    note: 'HarmonyOS NEXT 使用 HDC 而非 adb，当前工具无法连接，仅可手动按清单操作。',
    highlights: ['HDC 不受支持', '仅手动操作'],
  },
  // ── 三星 ──
  {
    code: 'SM-S9380',
    name: '三星 Galaxy S25 Ultra',
    brand: 'samsung',
    os: 'One UI 7',
    android: 'Android 15',
    status: 'reference',
    script: false,
    note: '国行版本广告入口较多，可参考三星清单；「自定义服务」是核心开关。',
    highlights: ['One UI 7 参考', '国行广告入口多'],
  },
  {
    code: 'SM-F9660',
    name: '三星 Galaxy Z Fold6',
    brand: 'samsung',
    os: 'One UI 6.1',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '折叠屏机型，参考三星清单；多屏截图需指定主屏。',
    highlights: ['折叠屏', '参考三星清单'],
  },
  // ── 小米补充 ──
  {
    code: 'M2405FPW',
    name: 'Xiaomi 15 / 15 Pro',
    brand: 'xiaomi',
    os: 'HyperOS 2.0',
    android: 'Android 15',
    status: 'reference',
    script: false,
    note: '与已实测机型同属 HyperOS，广告入口层级一致，可参考小米清单；部分小版本 msa 入口改名。',
    highlights: ['HyperOS 2 参考', '建议先只读检测'],
  },
  {
    code: 'M2312WKA',
    name: 'Redmi K70 / K70 Pro',
    brand: 'xiaomi',
    os: 'HyperOS 1.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'Redmi 结构与应用商店版本相关，社区反馈商店「服务管理」层级与 K60 相同。',
    highlights: ['社区反馈路径', '参考小米清单'],
  },
  {
    code: '23122PCD1G',
    name: 'Redmi Note 13 Pro',
    brand: 'xiaomi',
    os: 'HyperOS 1.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '走量机型，广告面与主流小米机型一致，含天气与日历内容推广。',
    highlights: ['走量机型', '天气 / 日历需单独处理'],
  },
  // ── OPPO 补充 ──
  {
    code: 'PJZ110',
    name: 'OPPO Reno12 Pro',
    brand: 'oppo',
    os: 'ColorOS 14.1',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'Reno 系列推广位以负一屏和软件商店为主，负一屏「推荐服务」总开关切勿整体关闭。',
    highlights: ['Reno 系列参考', '总开关勿关'],
  },
  {
    code: 'PKB110',
    name: '一加 12 / 12 Pro',
    brand: 'oppo',
    os: 'ColorOS 14.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '一加与 ColorOS 同底包，可参考一加 Ace 2 Pro 的实测脚本走安全模式。',
    highlights: ['与 Ace 2 Pro 同源', '可借脚本'],
  },
  {
    code: 'PJD110',
    name: '一加 Ace 3 / Ace 3V',
    brand: 'oppo',
    os: 'ColorOS 14.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'Ace 系列广告面与 Ace 2 Pro 一致，商店推广位与广告跟踪是重点。',
    highlights: ['Ace 系列参考', '广告跟踪无总开关'],
  },
  // ── vivo 补充 ──
  {
    code: 'V2324A',
    name: 'vivo X100 / X100 Pro',
    brand: 'vivo',
    os: 'OriginOS 4',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'OriginOS 4 的广告与隐私入口与 6 一致，快应用中心需要单独检测。',
    highlights: ['OriginOS 4 参考', '快应用需检测'],
  },
  {
    code: 'V2309A',
    name: 'vivo S18 / S18 Pro',
    brand: 'vivo',
    os: 'OriginOS 4',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'S 系列负一屏推荐位较多，关子项不要关总开关。',
    highlights: ['S 系列参考', '负一屏推荐位多'],
  },
  {
    code: 'iQOO-12',
    name: 'iQOO 12 / 12 Pro',
    brand: 'vivo',
    os: 'OriginOS 4',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'iQOO 与 vivo 同源，入口名称基本一致，参考 vivo 清单。',
    highlights: ['OriginOS 同源', '参考 vivo 清单'],
  },
  // ── 荣耀补充 ──
  {
    code: 'FCP-AN10',
    name: '荣耀 Magic6 / Magic6 Pro',
    brand: 'honor',
    os: 'MagicOS 8',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'MagicOS 8 的广告与隐私同样需要「显示系统程序」才能全量关闭。',
    highlights: ['MagicOS 8 参考', '需显示系统程序'],
  },
  {
    code: 'ALI-AN00',
    name: '荣耀 100 / 100 Pro',
    brand: 'honor',
    os: 'MagicOS 7.2',
    android: 'Android 13',
    status: 'reference',
    script: false,
    note: '数字系列走量机型，YOYO 建议与下拉搜索是主要广告来源。',
    highlights: ['YOYO 建议', '下拉搜索热榜'],
  },
  // ── 华为补充 ──
  {
    code: 'MNA-AL00',
    name: '华为 P60 / P60 Pro',
    brand: 'huawei',
    os: 'HarmonyOS 4.0',
    android: 'AOSP 12',
    status: 'reference',
    script: false,
    note: 'HarmonyOS 4 基于 AOSP，adb 可用；广告与隐私入口在隐私设置下。',
    highlights: ['adb 可用', 'HarmonyOS 4 参考'],
  },
  {
    code: 'ALN-AL80',
    name: '华为 Mate 60 / Mate 60 Pro+',
    brand: 'huawei',
    os: 'HarmonyOS 4.2',
    android: 'AOSP 12',
    status: 'reference',
    script: false,
    note: '与 Mate 60 Pro 同底包，参考同一份清单。',
    highlights: ['Mate 60 同源', '参考清单'],
  },
  {
    code: 'NOH-AN00',
    name: '华为 Mate 40 Pro',
    brand: 'huawei',
    os: 'HarmonyOS 3.0',
    android: 'AOSP 10',
    status: 'reference',
    script: false,
    note: '较老版本 HarmonyOS，设置层级与 4.x 有差异，建议先跑只读检测确认入口。',
    highlights: ['旧版本层级不同', '先只读检测'],
  },
  // ── 三星补充 ──
  {
    code: 'SM-S9280',
    name: '三星 Galaxy S24 Ultra',
    brand: 'samsung',
    os: 'One UI 6.1',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '国行 One UI 6.1，「自定义服务」为核心开关，三星应用商店另有推荐位。',
    highlights: ['One UI 6.1 参考', '自定义服务为核心'],
  },
  {
    code: 'SM-S9180',
    name: '三星 Galaxy S23 Ultra',
    brand: 'samsung',
    os: 'One UI 6.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '与 S24 系列入口一致，参考三星清单。',
    highlights: ['One UI 6 参考', '参考三星清单'],
  },
  {
    code: 'SM-A5560',
    name: '三星 Galaxy A55',
    brand: 'samsung',
    os: 'One UI 6.1',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'A 系列国行预装推广较多，含三星浏览器资讯推荐。',
    highlights: ['A 系列推广较多', '浏览器资讯推荐'],
  },
  // ── realme 补充 ──
  {
    code: 'realme-GT6',
    name: 'realme GT6',
    brand: 'realme',
    os: 'realme UI 5.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: 'realme UI 5 与 ColorOS 14 同源，参考 OPPO 清单。',
    highlights: ['ColorOS 同源', '参考 OPPO 清单'],
  },
  {
    code: 'realme-12PRO',
    name: 'realme 12 Pro+',
    brand: 'realme',
    os: 'realme UI 5.0',
    android: 'Android 14',
    status: 'reference',
    script: false,
    note: '数字系列推广位集中在软件商店与负一屏。',
    highlights: ['数字系列参考', '商店与负一屏'],
  },
];

export const getBrand = (slug: string) => BRANDS.find((b) => b.slug === slug);

export const getModelsByBrand = (slug: string) =>
  MODELS.filter((m) => m.brand === slug);

export const BRAND_STATS = BRANDS.map((brand) => {
  const list = getModelsByBrand(brand.slug);
  return {
    ...brand,
    total: list.length,
    verified: list.filter((m) => m.status === 'verified').length,
    scripts: list.filter((m) => m.script).length,
  };
});

export const SITE_STATS = {
  brands: BRANDS.length,
  models: MODELS.length,
  verified: MODELS.filter((m) => m.status === 'verified').length,
  scripts: MODELS.filter((m) => m.script).length,
};
