/** Public capability facts and destinations, shared by the interface and copy checks. */
export interface Feature { id: string; title: string; en: string; symbol: string; text: string; detail: string; href: string }
export const SITE_URL = 'https://tingque.ai/';
export const features: Feature[] = [
  {id: '01', title: 'AI 牌谱复盘', en: 'REPLAY ANALYSIS', symbol: '谱',
    text: '支持天凤、雀魂链接与雀姬分享码，覆盖四麻、三麻。逐手查看候选推荐、分歧与恶手、听牌率、危险度和顺位预测；支持回放、分享与多种四麻策略风格。',
    detail: '逐手对照 · 多维分析', href: 'https://tingque.ai/order/url'},
  {id: '02', title: '段位分析', en: 'RANK & EXPECTATION', symbol: '位',
    text: '输入四人半庄的场局、本场、供托、四家点数与段位 pt，查看四家顺位概率和 pt 期望，比较 160 种荣和、自摸与流局后的变化。',
    detail: '160 种结局 · 本地计算', href: '#rank-analyzer'},
  {id: '03', title: '第一打模拟', en: 'FIRST-DISCARD SIMULATION', symbol: '打',
    text: '为庄家配牌后的第一打选择 1–4 张候选，让 AI 为每种选择展开实打模拟，比较得点期望、和牌率、放铳率与顺位分布。',
    detail: '起手选择 · 模拟比较', href: 'https://tingque.ai/order/sim'},
  {id: '04', title: '局面逆推', en: 'HAND INFERENCE', symbol: '推',
    text: '在四麻报告中，根据牌桌公开信息，推测已有至少两组副露的对手手牌；列出最多 40 种候选，并给出向听、待张与点数参考。',
    detail: '公开信息 · 手牌推测', href: 'https://tingque.ai/order/reverse'},
  {id: '05', title: 'AI 陪练', en: 'AI PRACTICE', symbol: '练',
    text: '呼叫 1–4 个 AI 进行四人东风或半庄对局，分别选择平衡、门清进攻、副露进攻与防守风格，在实战中训练判断。',
    detail: '四种风格 · 实战训练', href: 'https://tingque.ai/order/room'},
];
