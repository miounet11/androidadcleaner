// 友情链接：与本站互相链接的站点。
// 只放已确认双向链接的站点，单向链接不算互换。
export type FriendLink = {
  name: string;
  url: string;
  desc: string;
};

export const FRIEND_LINKS: FriendLink[] = [
  {
    name: 'Strata',
    url: 'https://stratat.com/zh',
    desc: '本机运行的 AI 平台，游戏 PC 上跑大模型',
  },
];
