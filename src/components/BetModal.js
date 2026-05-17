import React, { useState, useEffect } from 'react';
import { SPORTS, HOUSES, MARKETS } from '../utils/constants';

const emptyLeg = () => ({ description:'', sport:'Futebol', market:'Resultado (1X2)', odd:'', result:'pending' });

const defaultForm = {
  type:'single', sport:'Futebol', description:'', house:'Bet365',
  market:'Resultado (1X2)', odd:'', stake:'', date: new Date().toISOString().split('T')[0],
  result:'pending', notes:'', tipster_id:'', estimated_prob:'',
};

export default function BetModal({ bet, tipsters=[], onSave, onClose }) {
  const [form, setForm]   = useState(defaultForm);
  const [legs, setLegs]   = useState([emptyLeg(), emptyLeg()]);
  const [busy, setBusy]   = useState(false);
  const [tab,  setTab]    = useState('single'); // 'single' | 'multiple'

  useEffect(() => {
    if (bet) {
      setForm({ ...defaultForm, ...bet, odd:String(bet.odd), stake:String(bet.stake),
                estimated_prob: bet.estimated_prob ? String(bet.estimated_prob*100) : '',
                tipster_id: bet.tipster_id ? String(bet.tipster_id) : '' });
      setTab(bet.type || 'single');
      if (bet.legs?.length) setLegs(bet.legs.map(l=>({...l, odd:String(l.odd)})));
    } else {
      setForm({ ...defaultForm, date: new Date().toISOString().split('T')[0] });
      setLegs([emptyLeg(), emptyLeg()]);
      setTab('single');
    }
  }, [bet]);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Multiple: compute combined odd from legs
  const combinedOdd = legs.reduce((acc,l) => {
    const o = parseFloat(l.odd);
    return o > 0 ? +(acc * o).toFixed(4) : acc;
  }, 1);

  const effectiveOdd = tab==='multiple' ? combinedOdd : (parseFloat(form.odd)||0);
  const stake = parseFloat(form.stake)||0;
  const totalReturn = +(effectiveOdd * stake).toFixed(2);
  const potentialProfit = +(stake*(effectiveOdd-1)).toFixed(2);

  // Value bet calculation
  const prob = parseFloat(form.estimated_prob)||0;
  const impliedProb = effectiveOdd>0 ? +(1/effectiveOdd*100).toFixed(1) : 0;
  const hasValue = prob>0 && effectiveOdd>0 && (prob/100) > (1/effectiveOdd);
  const valueEdge = prob>0 ? +((prob/100 - 1/effectiveOdd) * 100).toFixed(1) : 0;

  const updateLeg = (i,k,v) => setLegs(ls => ls.map((l,idx)=>idx===i?{...l,[k]:v}:l));
  const addLeg    = () => setLegs(ls=>[...ls, emptyLeg()]);
  const removeLeg = (i) => setLegs(ls=>ls.filter((_,idx)=>idx!==i));

  const handleSave = async () => {
    if (!form.description || !form.stake) { alert('Preencha descrição e valor.'); return; }
    if (tab==='single' && !form.odd) { alert('Preencha a odd.'); return; }
    if (tab==='multiple' && legs.some(l=>!l.description||!l.odd)) { alert('Preencha todas as seleções.'); return; }

    setBusy(true);
    const ep = prob>0 ? prob/100 : null;
    const payload = {
      ...form,
      type: tab,
      odd: tab==='multiple' ? combinedOdd : parseFloat(form.odd),
      stake: parseFloat(form.stake),
      tipster_id: form.tipster_id ? parseInt(form.tipster_id) : null,
      estimated_prob: ep,
    };
    if (tab==='multiple') {
      payload.legs = legs.map(l=>({...l, odd:parseFloat(l.odd)}));
    }
    try { await onSave(payload); }
    finally { setBusy(false); }
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{bet?'Editar Aposta':'Nova Aposta'}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Type tabs */}
          <div className="tab-bar" style={{marginBottom:0}}>
            <button className={`tab-btn ${tab==='single'?'active':''}`} onClick={()=>setTab('single')}>
              🎯 Simples
            </button>
            <button className={`tab-btn ${tab==='multiple'?'active':''}`} onClick={()=>setTab('multiple')}>
              🎰 Múltipla / Acumulada
            </button>
          </div>

          {/* Sport */}
          <div className="form-group">
            <span className="form-label">Esporte {tab==='multiple'?'(principal)':''}</span>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:2}}>
              {SPORTS.map(s=>(
                <button key={s.id} onClick={()=>set('sport',s.id)} style={{
                  padding:'4px 10px', borderRadius:20, fontSize:12, cursor:'pointer',
                  fontFamily:'inherit', fontWeight:form.sport===s.id?600:400,
                  background:form.sport===s.id?'var(--accent)':'var(--surface2)',
                  color:form.sport===s.id?'#fff':'var(--text)',
                  border:form.sport===s.id?'none':'1px solid var(--border)',
                }}>{s.emoji} {s.id}</button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <span className="form-label">Descrição *</span>
            <input value={form.description} onChange={e=>set('description',e.target.value)}
              placeholder={tab==='multiple'?'Ex: Acumulada do dia 15/05':'Ex: Flamengo x Palmeiras – Flamengo Vence'} />
          </div>

          {/* ── MÚLTIPLA: legs ── */}
          {tab==='multiple' && (
            <div className="form-group">
              <span className="form-label">Seleções ({legs.length})</span>
              {legs.map((leg,i)=>(
                <div key={i} className="leg-row" style={{marginTop:6}}>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                    <input placeholder={`Seleção ${i+1} – Ex: Real Madrid Vence`}
                      value={leg.description} onChange={e=>updateLeg(i,'description',e.target.value)} />
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 80px',gap:6}}>
                      <select value={leg.sport} onChange={e=>updateLeg(i,'sport',e.target.value)}>
                        {SPORTS.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.id}</option>)}
                      </select>
                      <select value={leg.market} onChange={e=>updateLeg(i,'market',e.target.value)}>
                        {MARKETS.map(m=><option key={m}>{m}</option>)}
                      </select>
                      <input type="number" step="0.01" min="1" placeholder="Odd"
                        value={leg.odd} onChange={e=>updateLeg(i,'odd',e.target.value)} />
                    </div>
                    {bet && (
                      <select value={leg.result} onChange={e=>updateLeg(i,'result',e.target.value)}>
                        <option value="pending">⏳ Pendente</option>
                        <option value="won">✅ Ganhou</option>
                        <option value="lost">❌ Perdeu</option>
                        <option value="void">⚪ Void</option>
                      </select>
                    )}
                  </div>
                  {legs.length>2&&(
                    <button className="btn btn-danger btn-icon btn-xs" onClick={()=>removeLeg(i)} style={{marginTop:2}}>✕</button>
                  )}
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{marginTop:8,alignSelf:'flex-start'}} onClick={addLeg}>
                + Adicionar seleção
              </button>
              {legs.length>=2&&(
                <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>
                  Odd combinada: <strong className="mono">{combinedOdd.toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <span className="form-label">Casa de Apostas</span>
              <select value={form.house} onChange={e=>set('house',e.target.value)}>
                {HOUSES.map(h=><option key={h}>{h}</option>)}
              </select>
            </div>
            {tab==='single'&&(
              <div className="form-group">
                <span className="form-label">Mercado</span>
                <select value={form.market} onChange={e=>set('market',e.target.value)}>
                  {MARKETS.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            {tab==='single'&&(
              <div className="form-group">
                <span className="form-label">Odd *</span>
                <input type="number" step="0.01" min="1" value={form.odd}
                  onChange={e=>set('odd',e.target.value)} placeholder="1.85" />
              </div>
            )}
            <div className="form-group">
              <span className="form-label">Valor Apostado (R$) *</span>
              <input type="number" step="0.01" min="0" value={form.stake}
                onChange={e=>set('stake',e.target.value)} placeholder="50.00" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <span className="form-label">Data</span>
              <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
            </div>
            <div className="form-group">
              <span className="form-label">Resultado</span>
              <select value={form.result} onChange={e=>set('result',e.target.value)}>
                <option value="pending">⏳ Pendente</option>
                <option value="won">✅ Ganhou</option>
                <option value="lost">❌ Perdeu</option>
                <option value="void">⚪ Void</option>
              </select>
            </div>
          </div>

          {/* Tipster */}
          <div className="form-row">
            <div className="form-group">
              <span className="form-label">Tipster / Estratégia</span>
              <select value={form.tipster_id} onChange={e=>set('tipster_id',e.target.value)}>
                <option value="">— Nenhum —</option>
                {tipsters.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <span className="form-label">Prob. Estimada (%)</span>
              <input type="number" step="0.1" min="0" max="100" value={form.estimated_prob}
                onChange={e=>set('estimated_prob',e.target.value)} placeholder="Ex: 55" />
              <span className="form-hint">Para detectar value bets. Odd implícita: {impliedProb}%</span>
            </div>
          </div>

          {/* Value indicator */}
          {prob>0&&effectiveOdd>0&&(
            <div className={`alert ${hasValue?'alert-success':'alert-info'}`} style={{fontSize:12}}>
              {hasValue
                ? `✅ VALUE BET detectado! Edge de +${valueEdge}% sobre a odd implícita.`
                : `ℹ️ Sem value aparente. Sua prob (${prob}%) ≤ odd implícita (${impliedProb}%).`}
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <span className="form-label">Notas</span>
            <textarea value={form.notes} onChange={e=>set('notes',e.target.value)}
              placeholder="Raciocínio, análise de mercado, comparação de odds..." />
          </div>

          {/* Return preview */}
          {stake>0&&effectiveOdd>0&&(
            <div style={{background:'var(--surface2)',borderRadius:'var(--radius)',padding:'12px 14px',
              display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div>
                <div className="form-label">Odd efetiva</div>
                <div className="mono fw6" style={{fontSize:17,marginTop:3}}>{effectiveOdd.toFixed(2)}</div>
              </div>
              <div>
                <div className="form-label">Retorno total</div>
                <div className="mono fw6" style={{fontSize:17,marginTop:3}}>R$ {totalReturn.toFixed(2)}</div>
              </div>
              <div>
                <div className="form-label">Lucro potencial</div>
                <div className="mono fw6 positive" style={{fontSize:17,marginTop:3}}>+R$ {potentialProfit.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={busy}>
            {busy?'Salvando…':bet?'✓ Atualizar':'+ Adicionar Aposta'}
          </button>
        </div>
      </div>
    </div>
  );
}
