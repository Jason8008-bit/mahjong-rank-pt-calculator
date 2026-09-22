import { Fragment, useState } from 'react';
import { ROUNDS, SEATS, ptValues, type Analysis, type AnalysisRequest, type Ending } from '../domain/rankpt';
import { download, toCSV, toJSON } from '../domain/export';

const signs = (value: number, digits = 2) => `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;
const number = (value: number) => value.toLocaleString('en-US');
const expectedRank = (row: number[]) => row.reduce((total, p, rank) => total + p * (rank + 1), 0).toFixed(2);
function endingLabel(e: Ending) {
  if (e.kind === 'ron') return `${SEATS[e.winner!]} 荣和 · ${SEATS[e.loser!]} 放铳`;
  if (e.kind === 'tsumo') return `${SEATS[e.winner!]} 自摸`;
  const ready = e.tenpai!.flatMap((v, s) => v ? [SEATS[s]] : []);
  return `流局 · ${ready.length === 0 ? '全员未听' : ready.length === 4 ? '全员听牌' : ready.join('、') + '听牌'}`;
}
export default function AnalysisResults({request, result, stale}: {request: AnalysisRequest; result: Analysis; stale: boolean}) {
  const [seat, setSeat] = useState(0);
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const rows = result.endings.map((ending, index) => ({ending, index})).filter(({ending}) => kind === 'all' || ending.kind === kind);
  if (sort !== 'default') rows.sort((a, b) => (sort === 'desc' ? -1 : 1) * (a.ending.ev_diff[seat] - b.ending.ev_diff[seat]));
  const pageSize = 12;
  const pages = Math.ceil(rows.length / pageSize);
  const currentPage = Math.min(page, pages - 1);
  return <div className="analysis-output" aria-label="分析结果">
    <div className="output-heading"><div><p className="eyebrow">CURRENT OUTLOOK</p><h3>四家顺位与 pt 期望</h3></div><span className="status"><i />本地计算</span></div>
    <p className="snapshot">{ROUNDS[request.kyoku_idx]} · {request.honba} 本场 · {request.kyotaku} 根供托 · pt {ptValues(request).map(v => signs(v, 0)).join(' / ')}</p>
    {stale && <p className="stale" role="status">输入已修改，点击计算更新结果。</p>}
    <div className="rank-cards">{result.rank_prob.map((row, index) => <article className={`rank-card ${index === seat ? 'selected' : ''}`} key={index}>
      <div className="rank-card-top"><span>{SEATS[index]}</span><span className="seat-letter">{index === request.kyoku_idx % 4 ? '本局亲家' : `${number(request.scores[index])} 点`}</span></div>
      <p className="ev-number">{signs(result.pt_ev[index])}<small>pt</small></p>
      <p className="expected">平均顺位 <strong>{expectedRank(row)}</strong></p>
      <div className="prob-bar" aria-hidden="true">{row.map((p, rank) => <span key={rank} className={`rank-${rank}`} style={{width: `${p * 100}%`}} />)}</div>
      <dl className="prob-list">{row.map((p, rank) => <div key={rank}><dt><i className={`rank-${rank}`} />{rank + 1} 位</dt><dd>{(p * 100).toFixed(1)}%</dd></div>)}</dl>
    </article>)}</div>
    <div className="scenario-heading"><div><h3>结局比较</h3><p>共 160 项结局</p></div><div className="export-actions">
      <button type="button" className="button subtle" onClick={() => download('tingque-analysis.json', toJSON(request, result), 'application/json')}>导出 JSON <span aria-hidden="true">↓</span></button>
      <button type="button" className="button subtle" onClick={() => download('tingque-analysis.csv', toCSV(request, result), 'text/csv;charset=utf-8')}>导出 CSV <span aria-hidden="true">↓</span></button>
    </div></div>
    <div className="table-controls"><label>观察座位<select value={seat} onChange={e => { setSeat(Number(e.target.value)); setPage(0); }}>{SEATS.map((s, i) => <option value={i} key={s}>{s}</option>)}</select></label>
      <label>结局类型<select value={kind} onChange={e => { setKind(e.target.value); setPage(0); setExpanded(null); }}><option value="all">全部结局</option><option value="ron">荣和</option><option value="tsumo">自摸</option><option value="ryuukyoku">流局</option></select></label>
      <label>排序<select value={sort} onChange={e => { setSort(e.target.value); setPage(0); }}><option value="default">默认顺序</option><option value="desc">期望变化：从高到低</option><option value="asc">期望变化：从低到高</option></select></label>
    </div>
    <p className="table-hint">比较的是各结局发生后的变化；这些结局不代表等概率事件。</p>
    <div className="table-scroll" tabIndex={0} role="region" aria-label="结局比较表，可横向滚动"><table>
      <thead><tr><th>结局 / 点数档位</th><th>{SEATS[seat]}点数变化</th><th>局后 pt</th><th>pt 变化</th><th><span className="sr-only">详情</span></th></tr></thead>
      <tbody>{rows.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(({ending: e, index}) => <Fragment key={index}>
        <tr><td><strong>{endingLabel(e)}</strong><span className="row-meta">{e.base_score === null ? '听牌结算' : `${number(e.base_score)} 点档`}</span></td>
          <td>{signs(e.deltas[seat], 0)}</td><td>{signs(e.pt_ev[seat])}</td><td className={e.ev_diff[seat] >= 0 ? 'positive' : 'negative'}>{signs(e.ev_diff[seat])}</td>
          <td><button className="detail-button" type="button" aria-label={`查看结局 ${index + 1} 详情`} aria-expanded={expanded === index} aria-controls={expanded === index ? `ending-${index}` : undefined} onClick={() => setExpanded(expanded === index ? null : index)}>{expanded === index ? '−' : '+'}</button></td></tr>
        {expanded === index && <tr id={`ending-${index}`} className="expanded-row"><td colSpan={5}><div className="ending-detail"><p>{e.next_state.game_over ? '按当前简化规则终局' : `下一局：${ROUNDS[e.next_state.kyoku_idx]} · ${e.next_state.honba} 本场 · ${e.next_state.kyotaku} 根供托`}</p>
          <div>{SEATS.map((s, i) => <p key={s}><strong>{s}</strong><span>{number(e.next_state.scores[i])} 点</span><span>{signs(e.pt_ev[i])} pt</span></p>)}</div></div></td></tr>}
      </Fragment>)}</tbody>
    </table></div>
    <div className="pagination"><span>已筛选 {rows.length} / 160 项</span><div><button type="button" disabled={currentPage === 0} onClick={() => { setPage(currentPage - 1); setExpanded(null); }} aria-label="上一页">←</button><span>{currentPage + 1} / {pages}</span><button type="button" disabled={currentPage + 1 >= pages} onClick={() => { setPage(currentPage + 1); setExpanded(null); }} aria-label="下一页">→</button></div></div>
    <p className="result-note">顺位概率采用分差启发式估计，用于比较局面；实际对局还受到手牌、牌山与玩家决策的影响。导出包含本次计算的全部 160 项结局。</p>
  </div>;
}
