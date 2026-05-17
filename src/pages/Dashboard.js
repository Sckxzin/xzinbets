import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { getStats } from '../utils/api';
import { SPORT_MAP } from '../utils/constants';
import StreakAlert from '../components/StreakAlert';

export default function Dashboard({ refreshKey, onNewBet }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStats().then(s=>{setStats(s);setLoading(false);}).catch(()=>setLoading(false));
  }, [refreshKey]);

  if (loading) return <Loader />;
  if (!stats)  return <Err />;

  const currentBankroll = parseFloat(stats.currentBankroll);
  const initialBankroll = parseFloat(stats.initialBankroll);
  const totalProfit     = parseFloat(stats.totalProfit);
  const roi             = parseFloat(stats.roi);
  const winRate         = parseFloat(stats.winRate);
  const avgOdd          = parseFloat(stats.avgOdd);
  const history         = (stats.history||[]).map(h=>({...h,value:parseFloat(h.value)}));

  const sportData = Object.entries(stats.sportStats||{}).map(([name,s])=>({
    name, profit:parseFloat(s.profit), emoji:SPORT_MAP[name]?.emoji||'🎯',
  })).sort((a,b)=>b.profit-a.profit);

  const trend = history.length>1
    ? ((history.at(-1).value - history[0].value)/history[0].value*100) : 0;

  const vb = stats.valueBets||{};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>
      <StreakAlert streak={stats.streak} />

      {vb.total>0&&(
        <div className="alert alert-info" style={{fontSize:13}}>
          🔍 <strong>{vb.total} value bet{vb.total>1?'s':''}</strong> registrada{vb.total>1?'s':''}.
          {vb.settled>0&&` Lucro: ${parseFloat(vb.profit)>=0?'+':'−'}R$ ${Math.abs(parseFloat(vb.profit)).toFixed(2)}`}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
        <MetricCard label="Bankroll" value={`R$ ${currentBankroll.toFixed(2)}`}
          sub={`Inicial R$ ${initialBankroll.toFixed(2)}`}
          color={currentBankroll>=initialBankroll?'var(--green)':'var(--red)'} />
        <MetricCard label="Lucro Total"
          value={`${totalProfit>=0?'+':'−'}R$ ${Math.abs(totalProfit).toFixed(2)}`}
          sub={`ROI ${roi>=0?'+':''}${roi.toFixed(2)}%`}
          color={totalProfit>=0?'var(--green)':'var(--red)'} />
        <MetricCard label="Taxa de Acerto" value={`${winRate.toFixed(1)}%`}
          sub={`${stats.won}G / ${stats.lost}P`} color="var(--accent)" />
        <MetricCard label="Odd Média" value={avgOdd.toFixed(2)}
          sub={`${stats.settled} liquidadas`} color="var(--accent)" />
        <MetricCard label="Tendência"
          value={`${trend>=0?'▲':'▼'} ${Math.abs(trend).toFixed(1)}%`}
          sub="var. do bankroll" color={trend>=0?'var(--green)':'var(--red)'} />
        <MetricCard label="Pendentes" value={stats.pending}
          sub={`de ${stats.total} total`} color="var(--amber)" />
      </div>

      {history.length>1&&(
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:14}}>Evolução do Bankroll</span>
            <span className="text3" style={{fontSize:12}}>{history.length-1} apostas liquidadas</span>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="label" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`} />
              <Tooltip formatter={v=>[`R$ ${parseFloat(v).toFixed(2)}`,'Bankroll']}
                contentStyle={{fontSize:12,borderRadius:8,border:'1px solid var(--border)'}} />
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5}
                dot={{r:2}} activeDot={{r:5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {sportData.length>0&&(
        <div className="card">
          <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Lucro por Esporte</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={sportData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize:10}} />
              <YAxis tick={{fontSize:10}} tickFormatter={v=>`R$${v}`} />
              <Tooltip formatter={v=>[`R$ ${parseFloat(v).toFixed(2)}`,'Lucro']} contentStyle={{fontSize:12}} />
              <Bar dataKey="profit" radius={[4,4,0,0]}>
                {sportData.map((e,i)=><Cell key={i} fill={e.profit>=0?'#176b3e':'#b52b2b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.total===0&&(
        <div style={{textAlign:'center',padding:'40px 20px',background:'var(--surface)',
          border:'2px dashed var(--border2)',borderRadius:'var(--radius-lg)',color:'var(--text2)'}}>
          <div style={{fontSize:36,marginBottom:10}}>📊</div>
          <div style={{fontWeight:700,marginBottom:6}}>Nenhuma aposta ainda</div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:14}}>Adicione sua primeira aposta para ver o dashboard.</div>
          <button className="btn btn-primary" onClick={onNewBet}>+ Primeira aposta</button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{color,fontSize:19}}>{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

const Loader = () => <div style={{padding:60,textAlign:'center',color:'var(--text3)'}}>Carregando…</div>;
const Err = () => <div style={{padding:60,textAlign:'center',color:'var(--red)'}}>Erro ao carregar. Verifique se o backend está rodando em http://localhost:3001</div>;
