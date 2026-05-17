import React from 'react';
import { SPORT_MAP, RESULT_LABELS } from '../utils/constants';

export default function BetRow({ bet, onEdit, onDelete, onResultChange }) {
  const sport = SPORT_MAP[bet.sport] || { emoji:'🎯', color:'#888' };
  const rl    = RESULT_LABELS[bet.result] || RESULT_LABELS.pending;

  // Postgres retorna NUMERIC como string — forçar conversão
  const odd   = parseFloat(bet.odd);
  const stake = parseFloat(bet.stake);

  const profit = () => {
    if (bet.result==='won')  return +(stake*(odd-1)).toFixed(2);
    if (bet.result==='lost') return -stake;
    return null;
  };
  const p = profit();

  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)',
      padding:'11px 14px', display:'flex', alignItems:'center', gap:12, transition:'border-color .15s',
    }}
    onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
    onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
    >
      <div style={{width:34,height:34,borderRadius:8,flexShrink:0,fontSize:17,
        background:sport.color+'18',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {sport.emoji}
      </div>

      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}>
          {bet.description}
          {(bet.is_value===true||bet.is_value===1)&&<span className="badge badge-value" style={{fontSize:10}}>VALUE</span>}
          {bet.type==='multiple'&&<span className="badge badge-multi" style={{fontSize:10}}>MÚLTIPLA {bet.legs?.length}×</span>}
        </div>
        <div style={{fontSize:11,color:'var(--text2)',marginTop:3,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          <span className={`badge badge-${rl.cls}`}>{rl.label}</span>
          {bet.tipster&&<span>📋 {bet.tipster.name}</span>}
          <span>{bet.market}</span>
          <span className="mono" style={{fontWeight:500}}>@{odd.toFixed(2)}</span>
          <span>{bet.house}</span>
          <span>{String(bet.date).substring(0,10)}</span>
        </div>
        {bet.type==='multiple'&&bet.legs?.length>0&&(
          <div style={{marginTop:6,display:'flex',flexWrap:'wrap',gap:4}}>
            {bet.legs.map((l,i)=>(
              <span key={i} style={{fontSize:10,background:'var(--surface2)',padding:'2px 7px',borderRadius:20,color:'var(--text2)'}}>
                {l.description} @{parseFloat(l.odd).toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </div>

      {bet.result==='pending'&&(
        <div style={{display:'flex',gap:4,flexShrink:0}}>
          <button className="btn btn-success btn-xs" title="Ganhou" onClick={()=>onResultChange(bet.id,'won')}>✓ G</button>
          <button className="btn btn-danger btn-xs"  title="Perdeu" onClick={()=>onResultChange(bet.id,'lost')}>✗ P</button>
        </div>
      )}

      <div style={{textAlign:'right',flexShrink:0,minWidth:88}}>
        {p!==null
          ? <div className={`mono fw6 ${p>=0?'positive':'negative'}`} style={{fontSize:14}}>
              {p>=0?'+':'−'}R$ {Math.abs(p).toFixed(2)}
            </div>
          : <div className="mono text3" style={{fontSize:13}}>R$ {(stake*odd).toFixed(2)}</div>
        }
        <div style={{fontSize:11,color:'var(--text3)',marginTop:1}}>Stake R$ {stake.toFixed(2)}</div>
      </div>

      <div style={{display:'flex',gap:4,flexShrink:0}}>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>onEdit(bet)} title="Editar">✎</button>
        <button className="btn btn-danger btn-sm btn-icon" onClick={()=>{ if(window.confirm('Excluir esta aposta?')) onDelete(bet.id); }} title="Excluir">🗑</button>
      </div>
    </div>
  );
}
