import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { getStats } from '../utils/api';
import { SPORT_MAP } from '../utils/constants';
import StreakAlert from '../components/StreakAlert';

export default function Dashboard({ refreshKey, onNewBet }) {
  const [stats,   setStats]   = useState(null);
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
  const goal            = parseFloat(stats.goal||0);
  const goalProgress    = parseFloat(stats.goalProgress||0);

  const sportData = Object.entries(stats.sportStats||{}).map(([name,s])=>({
    name, profit:parseFloat(s.profit), emoji:SPORT_MAP[name]?.emoji||'🎯',
  })).sort((a,b)=>b.profit-a.profit);

  const houseData = Object.entries(stats.houseStats||{}).map(([name,s])=>({
    name, profit:parseFloat(s.profit), count:s.count,
    winRate: s.settled>0?+(s.won/s.settled*100).toFixed(0):0,
  })).sort((a,b)=>b.profit-a.profit).slice(0,5);

  const trend = history.length>1
    ? ((history.at(-1).value - history[0].value)/history[0].value*100) : 0;
  const vb = stats.valueBets||{};

  return (
    <div style={{display:'flex',flexDirection:'column',gap:18}}>

      {/* ── Alertas ── */}
      <StreakAlert streak={stats.streak} />

      {/* Alerta de meta */}
      {stats.goalReached && (
        <div className="alert alert-success" style={{fontSize:13,fontWeight:600}}>
          🏆 PARABÉNS! Você atingiu sua meta de R$ {goal.toFixed(2)}! Hora de definir uma nova meta!
        </div>
      )}
      {stats.goalNear && !stats.goalReached && (
        <div className="alert alert-info" style={{fontSize:13}}>
          🔥 Você está a <strong>{(100-goalProgress).toFixed(1)}%</strong> de atingir sua meta de R$ {goal.toFixed(2)}! Continue assim!
        </div>
      )}
      {vb.total>0 && (
        <div className="alert alert-info" style={{fontSize:12}}>
          🔍 <strong>{vb.total} value bet{vb.total>1?'s':''}</strong> registrada{vb.total>1?'s':''}.
          {vb.settled>0&&` Lucro: ${parseFloat(vb.profit)>=0?'+':'−'}R$ ${Math.abs(parseFloat(vb.profit)).toFixed(2)}`}
        </div>
      )}

      {/* ── Meta de banca ── */}
      {goal>0 && (
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div>
              <div className="metric-label">Meta de Banca</div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginTop:2}}>
                R$ {currentBankroll.toFixed(2)}
                <span style={{color:'var(--text3)',fontWeight:400}}> / R$ {goal.toFixed(2)}</span>
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'var(--font-mono)',fontSize:22,fontWeight:700,
                color:goalProgress>=100?'var(--green)':goalProgress>=80?'var(--amber)':'var(--accent)'}}>
                {goalProgress}%
              </div>
              <div style={{fontSize:10,color:'var(--text3)'}}>concluído</div>
            </div>
          </div>
          {/* Barra de progresso */}
          <div style={{height:8,background:'var(--surface3)',borderRadius:4,overflow:'hidden'}}>
            <div style={{
              height:'100%', borderRadius:4, transition:'width .5s ease',
              width:`${goalProgress}%`,
              background: goalProgress>=100
                ? 'var(--green)'
                : goalProgress>=80
                ? 'linear-gradient(90deg,var(--accent),var(--amber))'
                : 'linear-gradient(90deg,var(--accent2),var(--accent))',
              boxShadow: `0 0 8px ${goalProgress>=100?'rgba(0,255,136,0.5)':'rgba(0,170,255,0.4)'}`,
            }} />
          </div>
          <div style={{fontSize:10,color:'var(--text3)',marginTop:6}}>
            Faltam R$ {Math.max(0, goal-currentBankroll).toFixed(2)} para atingir a meta
          </div>
        </div>
      )}

      {/* ── Métricas ── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10}}>
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

      {/* ── Bankroll chart ── */}
      {history.length>1 && (
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:13,fontFamily:'var(--font-brand)',color:'var(--accent)',letterSpacing:1}}>
              EVOLUÇÃO DO BANKROLL
            </span>
            <span style={{fontSize:11,color:'var(--text3)'}}>{history.length-1} apostas liquidadas</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,170,255,0.06)" />
              <XAxis dataKey="label" tick={{fontSize:10,fill:'rgba(0,170,255,0.4)'}} />
              <YAxis tick={{fontSize:10,fill:'rgba(0,170,255,0.4)'}} tickFormatter={v=>`R$${v}`} />
              <Tooltip formatter={v=>[`R$ ${parseFloat(v).toFixed(2)}`,'Bankroll']}
                contentStyle={{fontSize:12,borderRadius:6,background:'#0a0f1a',border:'1px solid rgba(0,170,255,0.3)',color:'#ddeeff'}} />
              {goal>0 && <line x1="0%" y1={goal} x2="100%" y2={goal} stroke="rgba(0,255,136,0.3)" strokeDasharray="4 4" />}
              <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5}
                dot={{r:2,fill:'var(--accent)'}} activeDot={{r:5}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Sport + Casa ── */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {sportData.length>0 && (
          <div className="card">
            <div style={{fontWeight:700,fontSize:12,fontFamily:'var(--font-brand)',color:'var(--accent)',letterSpacing:1,marginBottom:12}}>
              LUCRO POR ESPORTE
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={sportData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,170,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize:9,fill:'rgba(0,170,255,0.4)'}} />
                <YAxis tick={{fontSize:9,fill:'rgba(0,170,255,0.4)'}} tickFormatter={v=>`R$${v}`} />
                <Tooltip formatter={v=>[`R$ ${parseFloat(v).toFixed(2)}`,'Lucro']}
                  contentStyle={{fontSize:11,borderRadius:6,background:'#0a0f1a',border:'1px solid rgba(0,170,255,0.3)',color:'#ddeeff'}} />
                <Bar dataKey="profit" radius={[3,3,0,0]}>
                  {sportData.map((e,i)=><Cell key={i} fill={e.profit>=0?'#00ff88':'#ff4466'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {houseData.length>0 && (
          <div className="card">
            <div style={{fontWeight:700,fontSize:12,fontFamily:'var(--font-brand)',color:'var(--accent)',letterSpacing:1,marginBottom:12}}>
              RANKING DE CASAS
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7}}>
              {houseData.map((h,i)=>(
                <div key={h.name} style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:18,height:18,borderRadius:4,background:'rgba(0,170,255,0.1)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:10,fontWeight:700,color:'var(--accent)',flexShrink:0}}>
                    {i+1}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>{h.name}</div>
                    <div style={{fontSize:10,color:'var(--text3)'}}>{h.count} apostas · {h.winRate}% acerto</div>
                  </div>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,
                    color:h.profit>=0?'var(--green)':'var(--red)',flexShrink:0}}>
                    {h.profit>=0?'+':'−'}R$ {Math.abs(h.profit).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {stats.total===0 && (
        <div style={{textAlign:'center',padding:'40px 20px',background:'var(--surface)',
          border:'1px dashed var(--border2)',borderRadius:'var(--radius-lg)',color:'var(--text2)'}}>
          <div style={{fontSize:36,marginBottom:10,filter:'hue-rotate(200deg) saturate(3)'}}>🌹</div>
          <div style={{fontFamily:'var(--font-brand)',fontSize:13,color:'var(--accent)',letterSpacing:2,marginBottom:6}}>
            NENHUMA APOSTA AINDA
          </div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:14}}>
            Adicione sua primeira aposta para ver o dashboard em ação.
          </div>
          <button className="btn btn-primary" onClick={onNewBet}>+ PRIMEIRA APOSTA</button>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, color }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{color,fontSize:18}}>{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  );
}

const Loader = () => (
  <div style={{padding:60,textAlign:'center',color:'var(--text3)',fontFamily:'var(--font-brand)',fontSize:11,letterSpacing:3}}>
    CARREGANDO...
  </div>
);
const Err = () => (
  <div style={{padding:60,textAlign:'center',color:'var(--red)',fontSize:13}}>
    Erro ao carregar. Verifique se o backend está acessível.
  </div>
);
