import FeatureGrid from './components/FeatureGrid';
import RankAnalyzer from './components/RankAnalyzer';

export default function App() {
  return <><a className="skip-link" href="#rank-analyzer">跳到段位分析</a>
    <header className="site-header"><a className="brand" href="#top" aria-label="听雀 TingQue 首页"><span className="brand-mark" aria-hidden="true">雀</span><span>听雀 <strong>TingQue</strong></span></a>
      <nav aria-label="主导航"><a href="#capabilities">功能概览</a><a href="#rank-analyzer">段位分析</a><a href="#method">使用说明</a></nav>
      <a className="header-link" href="https://tingque.ai/" target="_blank" rel="noopener noreferrer">TingQue.ai <span aria-hidden="true">↗</span></a></header>
    <main id="top"><section className="hero" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow"><span className="tiny-rule" /> JAPANESE MAHJONG · AI TOOLKIT</p>
      <h1 id="hero-title">从每一次决策中<br />找到<span>提升空间。</span></h1><p className="hero-description">以日本麻将 AI 为核心，连接牌谱复盘、段位分析、<br />第一打模拟、局面逆推与 AI 陪练。覆盖分析、推演与实战训练。</p>
      <div className="hero-actions"><a className="button primary" href="#rank-analyzer">开始段位分析 <span aria-hidden="true">→</span></a><a className="hero-site-link" href="https://tingque.ai/" target="_blank" rel="noopener noreferrer">前往 TingQue.ai 使用完整功能 <span aria-hidden="true">↗</span></a></div>
      <div className="hero-footnote"><span>分析选择</span><i /><span>理解局面</span><i /><span>持续进步</span></div></div>
      <div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <span className="art-corner">TINGQUE / DECISION LAB</span><div className="mahjong-tile tile-back">北</div><div className="mahjong-tile tile-middle">發</div><div className="mahjong-tile tile-front"><span>听</span><strong>雀</strong><small>TINGQUE</small></div>
        <div className="art-caption"><span className="art-dot" /> 每一次选择，都值得看清。</div><div className="art-coordinates">分析 / 推演 / 训练</div></div>
    </section><FeatureGrid />
    <section className="coverage" aria-labelledby="coverage-title"><div><p className="eyebrow">DEEPER ANALYSIS</p><h2 id="coverage-title">让分析落到每一个决策。</h2><p>从候选推荐与分歧定位，到听牌率、危险度和顺位预测，多维指标帮助你精细审视每一手。四麻可对照平衡、门清进攻、副露进攻与防守风格。</p></div><div className="coverage-table"><p><strong>天凤 · 雀魂</strong><span>牌谱链接 / 四麻与三麻</span></p><p><strong>雀姬</strong><span>国内服分享码 / 四麻与三麻</span></p><p><strong>三麻说明</strong><span>平衡风格；听牌率标记立直家，危险度为综合估计</span></p><p><strong>四麻功能</strong><span>段位分析、第一打模拟、局面逆推、AI 陪练</span></p></div></section><RankAnalyzer />
    <section id="method" className="method-section" aria-labelledby="method-title"><div><p className="eyebrow">UNDER THE SURFACE</p><h2 id="method-title">理解结果，<br />才能用好结果。</h2><a href="https://tingque.ai/" target="_blank" rel="noopener noreferrer">探索听雀的完整工具集 <span aria-hidden="true">↗</span></a></div>
      <div className="method-items"><article><span>01</span><div><h3>比较不同结局的代价与收益</h3><p>段位分析枚举 108 项荣和、36 项自摸和 16 项流局，分别计算点数变化、局后顺位与 pt 变化。结局发生概率并未建模，不能把它们直接平均为胜率或总收益。</p></div></article>
        <article><span>02</span><div><h3>分差模型，用于局面研究</h3><p>本地顺位估计采用 Plackett–Luce 启发式模型，考虑分差与剩余局数。它不读取手牌、牌山或玩家水平，也不是听雀牌谱分析的 AI 模型。</p></div></article>
        <article><span>03</span><div><h3>规则清楚，结果才有上下文</h3><p>内置天凤四人半庄 pt，支持自定义。终局采用简化规则：南4起头名达到 30,000 点即结束，西4强制结束；同分按起家座位顺序。自摸采用等价总点数近似，不作为正式对局计分器。</p></div></article></div>
    </section><section className="closing"><p className="eyebrow">KEEP EXPLORING</p><h2>从看见问题，到理解选择。</h2><p>用 AI 牌谱复盘、第一打模拟、局面逆推与 AI 陪练，继续深入你的下一手。</p><a className="button primary" href="https://tingque.ai/" target="_blank" rel="noopener noreferrer">前往 TingQue.ai 使用完整功能 <span aria-hidden="true">↗</span></a></section>
    </main><footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark" aria-hidden="true">雀</span><span>听雀 <strong>TingQue</strong></span></a><p>日麻 AI 分析与训练工具集</p><span>Open source · MIT</span></footer></>;
}
