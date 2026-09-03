import React, { useEffect, useState, useCallback } from 'react';
import { getBets, deleteBet, updateBet } from '../utils/api';
import BetRow from '../components/BetRow';
import { SPORTS } from '../utils/constants';

const STATUS_FILTERS = [
  {id:'all',label:'Todas'},{id:'pending',label:'⏳ Pendentes'},
  {id:'won',label:'✅ Ganhas'},{id:'lost',label:'❌ Perdidas'},{id:'void',label:'⚪ Void'},
];
const TYPE_FILTERS = [
  {id:'all',label:'Todos tipos'},{id:'single',label:'Simples'},{id:'multiple',label:'Múltiplas'},
];

export default function BetsList({ refreshKey, tipsters=[], onEdit, onRefresh, toast }) {
  const [bets, setBets]     = useState([]);
  const [status, setStatus] = useState('all');
  const [sport,  setSport]  = useState('all');
  const [type,   setType]   = useState('all');
  const [tipster,setTipster]= useState('all');
  const [search, setSearch] = useState('');
  const [loading,setLoading]= useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status!=='all') params.result=status;
    if (sport !=='all') params.sport=sport;
    if (type  !=='all') params.type=type;
    if (tipster!=='all') params.tipster_id=tipster;
    getBets(params).then(d=>{setBets(d);setLoading(false);}).catch(e=>{console.error(e);setLoading(false);});
  }, [status,sport,type,tipster]);

  useEffect(()=>{ load(); }, [load,refreshKey]);

  const handleDelete = async(id) => {
    await deleteBet(id);
    toast('Aposta excluída','default');
    onRefresh();
  };

  const handleResultChange = async(id,result) => {
    await updateBet(id,{result});
    toast(result==='won'?'✅ Marcada como Ganhou!':'❌ Marcada como Perdeu', result==='won'?'success':'error');
    onRefresh();
  };

  const filtered = bets.filter(b=>
    !search || b.description.toLowerCase().includes(search.toLowerCase()) || b.house.toLowerCase().includes(search.toLowerCase())
  );

  const totalProfit = filtered.filter(b=>b.result!=='pending'&&b.result!=='void')
    .reduce((s,b)=>s+(b.result==='won'?+(b.stake*(b.odd-1)).toFixed(2):-b.stake),0);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Search + dropdowns */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
        <input style={{maxWidth:220}} placeholder="🔍 Buscar…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={{maxWidth:160}} value={sport} onChange={e=>setSport(e.target.value)}>
          <option value="all">Todos esportes</option>
          {SPORTS.map(s=><option key={s.id} value={s.id}>{s.emoji} {s.id}</option>)}
        </select>
        <select style={{maxWidth:160}} value={tipster} onChange={e=>setTipster(e.target.value)}>
          <option value="all">Todos tipsters</option>
          {tipsters.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select style={{maxWidth:140}} value={type} onChange={e=>setType(e.target.value)}>
          {TYPE_FILTERS.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </div>

      {/* Status chips */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
        {STATUS_FILTERS.map(f=>(
          <button key={f.id} className={`chip ${status===f.id?'active':''}`} onClick={()=>setStatus(f.id)}>{f.label}</button>
        ))}
        <span style={{marginLeft:'auto',fontSize:12,color:'var(--text3)'}}>
          {filtered.length} apostas
          {filtered.length>0&&<span className={`mono ${totalProfit>=0?'positive':'negative'}`} style={{marginLeft:8}}>
            {totalProfit>=0?'+':'−'}R$ {Math.abs(totalProfit).toFixed(2)}
          </span>}
        </span>
      </div>

      {/* List */}
      {loading ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Carregando…</div>
        : filtered.length===0 ? <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Nenhuma aposta encontrada.</div>
        : <div style={{display:'flex',flexDirection:'column',gap:7}}>
            {filtered.map(b=>(
              <BetRow key={b.id} bet={b} onEdit={onEdit} onDelete={handleDelete} onResultChange={handleResultChange} />
            ))}
          </div>
      }
    </div>
  );
}
