import React, { useEffect, useState } from 'react';
import { getTipsterStats, createTipster, updateTipster, deleteTipster } from '../utils/api';

export default function Tipsters({ refreshKey, onTipstersChange, toast }) {
  const [tipsters, setTipsters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [name, setName]         = useState('');
  const [notes, setNotes]       = useState('');
  const [busy, setBusy]         = useState(false);

  const load = () => getTipsterStats().then(d=>{ setTipsters(d); onTipstersChange?.(d); }).catch(console.error);
  useEffect(()=>{ load(); }, [refreshKey]);

  const openNew  = () => { setEditItem(null); setName(''); setNotes(''); setShowForm(true); };
  const openEdit = (t) => { setEditItem(t); setName(t.name); setNotes(t.notes||''); setShowForm(true); };
  const cancel   = () => { setShowForm(false); setEditItem(null); };

  const save = async() => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      if (editItem) { await updateTipster(editItem.id,{name,notes}); toast('Tipster atualizado','success'); }
      else          { await createTipster({name,notes}); toast('Tipster criado','success'); }
      cancel(); load();
    } catch(e) { toast(e.response?.data?.error||'Erro','error'); }
    finally { setBusy(false); }
  };

  const remove = async(t) => {
    if (!window.confirm(`Excluir "${t.name}"?`)) return;
    await deleteTipster(t.id);
    toast('Tipster removido','default');
    load();
  };

  // Forçar parseFloat nos campos numéricos vindos do Postgres
  const parsed = tipsters.map(t=>({
    ...t,
    profit:  parseFloat(t.profit)||0,
    roi:     parseFloat(t.roi)||0,
    winRate: parseFloat(t.winRate)||0,
  }));

  const best = parsed.length>0 && parsed.some(t=>t.settled>0)
    ? parsed.filter(t=>t.settled>0).reduce((a,b)=>b.profit>a.profit?b:a)
    : null;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontWeight:700,fontSize:15}}>Tipsters & Estratégias</div>
          <div className="text3" style={{fontSize:12,marginTop:2}}>Organize suas apostas por fonte ou sistema</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Tipster</button>
      </div>

      {best&&(
        <div className="alert alert-success" style={{fontSize:13}}>
          🏆 Melhor tipster: <strong>{best.name}</strong> — {best.winRate.toFixed(1)}% de acerto, lucro de +R$ {best.profit.toFixed(2)}
        </div>
      )}

      {showForm&&(
        <div className="card" style={{border:'1px solid var(--border2)'}}>
          <div style={{fontWeight:600,fontSize:14,marginBottom:12}}>{editItem?'Editar':'Novo'} Tipster</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            <div className="form-group">
              <span className="form-label">Nome *</span>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: Minha estratégia, Carlos Tips..." />
            </div>
            <div className="form-group">
              <span className="form-label">Notas</span>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tipo de mercado, bankroll alocado, regras..." />
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-primary" onClick={save} disabled={busy||!name.trim()}>
                {busy?'Salvando…':editItem?'Atualizar':'Criar'}
              </button>
              <button className="btn btn-ghost" onClick={cancel}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {parsed.length===0 ? (
        <div style={{textAlign:'center',padding:'40px 20px',background:'var(--surface)',
          border:'2px dashed var(--border2)',borderRadius:'var(--radius-lg)',color:'var(--text2)'}}>
          <div style={{fontSize:32,marginBottom:8}}>📋</div>
          <div style={{fontWeight:600,marginBottom:6}}>Nenhum tipster ainda</div>
          <div style={{fontSize:12,color:'var(--text3)',marginBottom:14}}>
            Crie tipsters para organizar suas apostas por estratégia ou fonte.
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Criar primeiro tipster</button>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {parsed.map(t=>(
            <div key={t.id} className="card" style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px'}}>
              <div style={{width:40,height:40,borderRadius:10,background:'var(--accent)',
                display:'flex',alignItems:'center',justifyContent:'center',
                color:'#fff',fontWeight:700,fontSize:14,flexShrink:0}}>
                {t.name.substring(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{t.name}</div>
                {t.notes&&<div className="text3" style={{fontSize:12,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.notes}</div>}
              </div>
              <div style={{display:'flex',gap:20,flexShrink:0}}>
                <StatCell label="Apostas" value={t.total} />
                <StatCell label="Acerto" value={t.settled>0?`${t.winRate.toFixed(1)}%`:'—'} />
                <StatCell label="ROI" value={t.settled>0?`${t.roi>=0?'+':''}${t.roi.toFixed(1)}%`:'—'}
                  color={t.roi>=0?'var(--green)':'var(--red)'} />
                <StatCell label="Lucro"
                  value={t.settled>0?`${t.profit>=0?'+':'−'}R$ ${Math.abs(t.profit).toFixed(2)}`:'—'}
                  color={t.profit>=0?'var(--green)':'var(--red)'} mono />
              </div>
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={()=>openEdit(t)}>✎</button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={()=>remove(t)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, color, mono }) {
  return (
    <div style={{textAlign:'right',minWidth:60}}>
      <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.4px',fontWeight:600}}>{label}</div>
      <div style={{fontSize:13,fontWeight:700,marginTop:2,color:color||'var(--text)',fontFamily:mono?'JetBrains Mono,monospace':'inherit'}}>
        {value}
      </div>
    </div>
  );
}
