import { useEffect, useRef, useState, type FormEvent } from 'react';
import { analyze, DEFAULT_REQUEST, DANS, ROUNDS, SEATS, TABLES, type AnalysisRequest } from '../domain/rankpt';
import AnalysisResults from './AnalysisResults';

function initialForm(request = DEFAULT_REQUEST) {
  return {round: String(request.kyoku_idx), honba: String(request.honba), kyotaku: String(request.kyotaku),
    scores: request.scores.map(String), table: request.table ?? '特上', dan: request.dan ?? '四段',
    mode: 'preset', custom: ['75', '30', '0', '-90']};
}
function parse(value: string, label: string) {
  if (!/^-?\d+$/.test(value.trim())) throw new Error(`请填写${label}（整数）。`);
  return Number(value);
}
export default function RankAnalyzer() {
  const [form, setForm] = useState(initialForm);
  const [snapshot, setSnapshot] = useState(() => ({request: DEFAULT_REQUEST, result: analyze(DEFAULT_REQUEST), revision: 0}));
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  function update(patch: Partial<typeof form>) { setForm(prev => ({...prev, ...patch})); setDirty(true); setError(''); }
  function reset(request: AnalysisRequest) {
    setForm(initialForm(request));
    setSnapshot(prev => ({request, result: analyze(request), revision: prev.revision + 1}));
    setDirty(false); setError('');
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const custom = form.custom.map((value, i) => form.mode === 'custom' ? parse(value, `${i + 1} 位 pt`) : 0);
      const request: AnalysisRequest = {
        kyoku_idx: parse(form.round, '场局'), honba: parse(form.honba, '本场'), kyotaku: parse(form.kyotaku, '供托'),
        scores: form.scores.map((value, seat) => parse(value, `${SEATS[seat]}点数`)), table: form.table, dan: form.dan,
        ...(form.mode === 'custom' ? {custom_pt: {first: custom[0], second: custom[1], third: custom[2], fourth: custom[3]}} : {}),
      };
      const result = analyze(request);
      setSnapshot(prev => ({request, result, revision: prev.revision + 1}));
      setError(''); setDirty(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : '请检查输入。';
      setError(message);
      if (message === error) errorRef.current?.focus();
    }
  }
  return <section id="rank-analyzer" className="analyzer-section" aria-labelledby="analyzer-title">
    <div className="section-heading"><div><p className="eyebrow">RANK LAB / 段位分析</p><h2 id="analyzer-title">这一次选择，对段位意味着什么？</h2></div><p>输入局面，比较结局。<br />在当前设备完成计算与导出。</p></div>
    <div className="analyzer-shell"><form className="input-panel" onSubmit={submit} noValidate>
      <div className="input-title"><h3>设定局面</h3><span>四人 · 半庄</span></div>
      <div className="preset-row"><button type="button" onClick={() => reset({...DEFAULT_REQUEST, kyoku_idx: 7, honba: 2, kyotaku: 1, scores: [45000, 28000, 18000, 8000]})}>载入南4示例 <span aria-hidden="true">↗</span></button><button type="button" onClick={() => reset(DEFAULT_REQUEST)}>恢复默认</button></div>
      <label className="field">场局<select value={form.round} onChange={e => update({round: e.target.value})}>{ROUNDS.map((round, index) => <option value={index} key={round}>{round}</option>)}</select></label>
      <div className="field-pair"><label className="field">本场<input type="number" min="0" max="100" step="1" value={form.honba} onChange={e => update({honba: e.target.value})} /></label>
        <label className="field">供托（根）<input type="number" min="0" max="100" step="1" value={form.kyotaku} onChange={e => update({kyotaku: e.target.value})} /></label></div>
      <fieldset><legend>四家点数</legend><p className="field-note">座位按起家固定，本局亲家随场局轮换。</p>
        <div className="score-inputs">{SEATS.map((seat, index) => <label className="score-field" key={seat}><span>{seat}<small>{index === Number(form.round) % 4 ? '亲家' : '点数'}</small></span>
          <input aria-label={`${seat}点数`} type="number" step="100" min="-100000" max="1000000" value={form.scores[index]} onChange={e => update({scores: form.scores.map((value, i) => i === index ? e.target.value : value)})} /></label>)}</div>
      </fieldset>
      <label className="field">pt 规则<select value={form.mode} onChange={e => update({mode: e.target.value})}><option value="preset">天凤四人半庄</option><option value="custom">自定义顺位 pt</option></select></label>
      {form.mode === 'preset' ? <div className="field-pair"><label className="field">想定卓<select value={form.table} onChange={e => update({table: e.target.value})}>{Object.keys(TABLES).map(table => <option key={table}>{table}</option>)}</select></label>
        <label className="field">想定段位<select value={form.dan} onChange={e => update({dan: e.target.value})}>{Object.keys(DANS).map(dan => <option key={dan}>{dan}</option>)}</select></label></div> : <div className="custom-pts">{['一', '二', '三', '四'].map((rank, index) => <label className="field" key={rank}>{rank}位 pt<input type="number" min="-1000" max="1000" step="1" value={form.custom[index]} onChange={e => update({custom: form.custom.map((v, i) => i === index ? e.target.value : v)})} /></label>)}</div>}
      {error && <p className="input-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</p>}
      <button type="submit" className="button primary calculate">计算段位期望 <span aria-hidden="true">→</span></button>
      <p className="field-note privacy-note">点数与计算结果保留在当前页面，不上传。</p>
    </form><AnalysisResults key={snapshot.revision} request={snapshot.request} result={snapshot.result} stale={dirty} /></div>
  </section>;
}
