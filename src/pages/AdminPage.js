import React, { useEffect, useState } from 'react';
import { getAdminStats, createUser } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user } = useAuth();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [invEmail, setInvEmail] = useState('');
  const [invPass,  setInvPass]  = useState('');
  const [invMsg,   setInvMsg]   = useState('');
  const [invBusy,  setInvBusy]  = useState(false);

  const load = () => {
    setLoading(true);
    getAdminStats().then(d=>{ setData(d); setLoading(false); }).catch(e=>{console.error(e);setLoading(false);});
  };
  useEffect(load, []);

  const sendInvite = async () => {
    if (!invEmail || !invPass) return;
    setInvBusy(true); setInvMsg('');
    try {
      await createUser({ email: invEmail, password: invPass });
      setInvMsg(`✅ Usuário ${invEmail} criado! Compartilhe a senha com ele por um canal seguro.`);
      setInvEmail(''); setInvPass('');
      load();
    } catch (err) {
      setInvMsg(`❌ Erro: ${err.message}`);
    }
    setInvBusy(false);
  };

  if (loading) return <div style={{padding:40,textAlign:'center',color:'var(--text3)'}}>Carregando…</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
        <div className="metric-card">
          <div className="metric-label">Total Usuários</div>
          <div className="metric-value" style={{fontSize:28}}>{data.totalUsers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Total Apostas</div>
          <div className="metric-value" style={{fontSize:28}}>{data.totalBets}</div>
          <div className="metric-sub">em toda a plataforma</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Seu email</div>
          <div style={{fontSize:12,fontWeight:600,marginTop:6,wordBreak:'break-all'}}>{user?.email}</div>
          <div className="metric-sub" style={{color:'var(--green)'}}>● Admin</div>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>✉️ Criar Usuário</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <input style={{flex:1,minWidth:200}} type="email" placeholder="email@exemplo.com"
            value={invEmail} onChange={e=>setInvEmail(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&sendInvite()} />
          <input style={{flex:1,minWidth:160}} type="text" placeholder="senha inicial (min. 8 caracteres)"
            value={invPass} onChange={e=>setInvPass(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&sendInvite()} />
          <button className="btn btn-primary" onClick={sendInvite} disabled={invBusy||!invEmail||!invPass}>
            {invBusy?'Criando…':'Criar acesso'}
          </button>
        </div>
        {invMsg&&(
          <div style={{marginTop:10,fontSize:13,color:invMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>
            {invMsg}
          </div>
        )}
        <div style={{fontSize:12,color:'var(--text3)',marginTop:8}}>
          Defina uma senha inicial e compartilhe com o convidado por um canal seguro
          (ex: WhatsApp). Não há envio automático de email neste sistema.
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>👥 Usuários ({data.users.length})</div>
        {data.users.length===0
          ? <div className="text3">Nenhum usuário ainda.</div>
          : <table className="tbl">
              <thead><tr>
                <th>Email</th><th>Apostas</th><th>Acerto</th>
                <th style={{textAlign:'right'}}>Lucro</th><th>Cadastro</th>
              </tr></thead>
              <tbody>
                {data.users.map(u=>(
                  <tr key={u.id}>
                    <td style={{fontWeight:500}}>
                      {u.email}
                      {u.email===user?.email&&<span className="badge badge-value" style={{marginLeft:6,fontSize:10}}>você</span>}
                    </td>
                    <td className="text2">{u.total}</td>
                    <td className="text2">{u.settled>0?`${u.winRate}%`:'—'}</td>
                    <td style={{textAlign:'right'}}>
                      {u.settled>0
                        ? <span className={`mono fw6 ${u.profit>=0?'positive':'negative'}`}>
                            {u.profit>=0?'+':'−'}R$ {Math.abs(u.profit).toFixed(2)}
                          </span>
                        : <span className="text3">—</span>
                      }
                    </td>
                    <td className="text3" style={{fontSize:12}}>
                      {u.created_at?new Date(u.created_at).toLocaleDateString('pt-BR'):'—'}
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
