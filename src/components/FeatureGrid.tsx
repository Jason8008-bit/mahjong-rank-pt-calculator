import { features } from '../content/features';
export default function FeatureGrid() {
  return <section id="capabilities" className="capabilities" aria-label="五项核心能力">
    <div className="section-heading"><div><p className="eyebrow">THE TOOLKIT / 五项核心能力</p><h2>从一手选择，到整场判断。</h2></div>
      <p>复盘、推演、训练。<br />让每个问题都有继续深入的入口。</p></div>
    <div className="feature-grid">{features.map(feature => <article className="feature" key={feature.id}>
      <div className="feature-top"><span className="feature-symbol" aria-hidden="true">{feature.symbol}</span><span className="feature-number">{feature.id}</span></div>
      <p className="feature-en">{feature.en}</p><h3>{feature.title}</h3><p className="feature-description">{feature.text}</p>
      <p className="feature-detail">{feature.detail}</p>
      <a href={feature.href} {...(feature.href.startsWith('https:') ? {target: '_blank', rel: 'noopener noreferrer'} : {})}>
        {feature.id === '02' ? '打开段位分析' : '前往 TingQue.ai 使用'}<span aria-hidden="true">↗</span>
      </a>
    </article>)}</div>
  </section>;
}
