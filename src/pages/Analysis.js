import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, ReferenceLine,
} from 'recharts';
import { getStats } from '../utils/api';
import { SPORT_MAP } from '../utils/constants';

export default function Analysis({ refreshKey }) {
  const [stats, setStats] = useState(null);
  useEffect(()=>{ getStats().then(setStats).catch(console.error); }, [refreshKey]);
  if (!stats) return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Carregando…</div>;

  const sportRows = Object.entries(stats.sportStats||{}).map(([name,s])=>({
    name, emoji:SPORT_MAP[name]?.emoji||'🎯',
    count:s.count, won:s.won, settled:s.settled,
    profit:parseFloat(s.profit),
    stake:parseFloat(s.stake),
    winRate:s.settled>0?(s.won/s.settled*100).toFixed(1):'-',
    roi:parseFloat(s.stake)>0?(parseFloat(s.profit)/parseFloat(s.stake)*100).toFixed(1):'-',
  })).sort((a,b)=>b.profit-a.profit);

  const monthlyLabels = (stats.monthlyArr||[]).map(m=>{
    const [y,mo]=m.month.split('-');
    const names=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return { ...m, profit:parseFloat(m.profit), roi:parseFloat(m.roi), label:`${names[parseInt(mo)-1]}/${y.slice(2)}` };
  });

  const history = (stats.history||[]).map(h=>({...h,value:parseFloat(h.value)}));
  const initialBankroll = parseFloat(stats.initialBankroll);

  const perBetData = history.slice(1).map((h,i)=>({
    label:h.label,
    pnl:+(h.value-(i===0?history[0].value:history[i].value)).toFixed(2),
  }));

  const avgMonthlyProfit = monthlyLabels.length>0
    ? monthlyLabels.reduce((s,m)=>s+m.profit,0)/monthlyLabels.length : 0;

  const vb = stats.valueBets||{total:0,settled:0,profit:0};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:10}}>
        <div className="metric-card">
          <div className="metric-label">Média mensal</div>
          <div className={`metric-value ${avgMonthlyProfit>=0?'positive':'negative'}`} style={{fontSize:18}}>
            {avgMonthlyProfit>=0?'+':'−'}R$ {Math.abs(avgMonthlyProfit).toFixed(2)}
          </div>
          <div className="metric-sub">{monthlyLabels.length} mese{monthlyLabels.length!==1?'s':''} com dados</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Melhor mês</div>
          {monthlyLabels.length>0 ? (()=>{
            const best=monthlyLabels.reduce((a,b)=>b.profit>a.profit?b:a);
            return <><div className="metric-value positive" style={{fontSize:18}}>+R$ {best.profit.toFixed(2)}</div><div className="metric-sub">{best.label}</div></>;
          })() : <div className="metric-value text3" style={{fontSize:18}}>—</div>}
        </div>
        <div className="metric-card">
          <div className="metric-label">Pior mês</div>
          {monthlyLabels.length>0 ? (()=>{
            const worst=monthlyLabels.reduce((a,b)=>b.profit<a.profit?b:a);
            return <><div className={`metric-value ${worst.profit>=0?'positive':'negative'}`} style={{fontSize:18}}>{worst.profit>=0?'+':'−'}R$ {Math.abs(worst.profit).toFixed(2)}</div><div className="metric-sub">{worst.label}</div></>;
          })() : <div className="metric-value text3" style={{fontSize:18}}>—</div>}
        </div>
        <div className="metric-card">
          <div className="metric-label">Value Bets</div>
          <div className="metric-value" style={{fontSize:18,color:'var(--purple)'}}>{vb.total}</div>
          <div className="metric-sub">{vb.settled>0?`Lucro: ${parseFloat(vb.profit)>=0?'+':'−'}R$ ${Math.abs(parseFloat(vb.profit)).toFixed(2)}`:'Nenhuma liquidada'}</div>
        </div>
      </div>

      {monthlyLabels.length>0&&(
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Lucro por Mês (R$)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyLabels} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`} />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.2)" />
              <Tooltip formatter={(v,_,{payload:p})=>[`R$ ${parseFloat(v).toFixed(2)}`,`${p.total} apostas`]} contentStyle={{fontSize:12,borderRadius:8}} />
              <Bar dataKey="profit" radius={[4,4,0,0]}>
                {monthlyLabels.map((m,i)=><Cell key={i} fill={m.profit>=0?'#176b3e':'#b52b2b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {history.length>1&&(
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Curva do Bankroll</div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="label" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`} />
              <Tooltip formatter={v=>[`R$ ${parseFloat(v).toFixed(2)}`,'Bankroll']} contentStyle={{fontSize:12,borderRadius:8}} />
              <ReferenceLine y={initialBankroll} stroke="#888" strokeDasharray="4 4"
                label={{value:'Banca inicial',position:'insideTopLeft',fontSize:10,fill:'#888'}} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {perBetData.length>0&&(
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>P&L por Aposta Liquidada</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={perBetData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{fontSize:9}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`} />
              <ReferenceLine y={0} stroke="rgba(0,0,0,0.2)" />
              <Tooltip formatter={v=>[`${v>=0?'+':''}R$ ${parseFloat(v).toFixed(2)}`,'P&L']} contentStyle={{fontSize:12}} />
              <Bar dataKey="pnl" radius={[3,3,0,0]}>
                {perBetData.map((d,i)=><Cell key={i} fill={d.pnl>=0?'#176b3e':'#b52b2b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Performance por Esporte</div>
        {sportRows.length===0
          ? <div className="text3" style={{fontSize:13}}>Sem dados ainda.</div>
          : <table className="tbl">
              <thead><tr>
                <th>Esporte</th><th>Apostas</th><th>G / P</th><th>Acerto</th><th>ROI</th><th style={{textAlign:'right'}}>Lucro</th>
              </tr></thead>
              <tbody>
                {sportRows.map(s=>(
                  <tr key={s.name}>
                    <td style={{fontWeight:600}}>{s.emoji} {s.name}</td>
                    <td className="text2">{s.count}</td>
                    <td className="text2">{s.won}G / {s.settled-s.won}P</td>
                    <td className="text2">{s.winRate!=='-'?`${s.winRate}%`:'—'}</td>
                    <td className={s.roi!=='-'&&parseFloat(s.roi)>=0?'positive':'negative'}>
                      {s.roi!=='-'?`${parseFloat(s.roi)>=0?'+':''}${s.roi}%`:'—'}
                    </td>
                    <td style={{textAlign:'right'}}>
                      <span className={`mono fw6 ${s.profit>=0?'positive':'negative'}`}>
                        {s.profit>=0?'+':'−'}R$ {Math.abs(s.profit).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}
