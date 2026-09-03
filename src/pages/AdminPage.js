import React, { useEffect, useState } from 'react';
import { getAdminStats, createUser, resetUserPassword } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function AdminPage({ toast }) {
  const { user } = useAuth();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [invEmail, setInvEmail]   = useState('');
  const [invMsg,   setInvMsg]     = useState('');
  const [invBusy,  setInvBusy]    = useState(false);
  const [genPass,  setGenPass]    = useState(null); // {email, password} da última criação

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPass,   setResetPass]   = useState('');
  const [resetBusy,   setResetBusy]   = useState(false);

  const load = () => {
    setLoading(true);
    getAdminStats().then(d=>{ setData(d); setLoading(false); }).catch(e=>{console.error(e);setLoading(false);});
  };
  useEffect(load, []);

  const sendInvite = async () => {
    if (!invEmail) return;
    setInvBusy(true); setInvMsg(''); setGenPass(null);
    try {
      const created = await createUser({ email: invEmail });
      setGenPass({ email: created.email, password: created.password });
      setInvEmail('');
      load();
    } catch (err) {
      setInvMsg(`❌ Erro: ${err.message}`);
    }
    setInvBusy(false);
  };

  const copyGenPass = () => {
    if (!genPass) return;
    navigator.clipboard?.writeText(genPass.password);
    toast?.('Senha copiada! ✓', 'success');
  };

  const openReset  = (id) => { setResetTarget(id); setResetPass(''); };
  const cancelReset = () => { setResetTarget(null); setResetPass(''); };

  const confirmReset = async () => {
    if (!resetPass || resetPass.length < 8) return;
    setResetBusy(true);
    try {
      await resetUserPassword(resetTarget, resetPass);
      toast?.('Senha redefinida! ✓', 'success');
      cancelReset();
    } catch (err) {
      toast?.(err.message, 'error');
    }
    setResetBusy(false);
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
          <button className="btn btn-primary" onClick={sendInvite} disabled={invBusy||!invEmail}>
            {invBusy?'Criando…':'Criar acesso'}
          </button>
        </div>
        {invMsg&&<div style={{marginTop:10,fontSize:13,color:'var(--red)'}}>{invMsg}</div>}
        {genPass&&(
          <div style={{marginTop:12,padding:12,borderRadius:'var(--radius-sm)',
            background:'var(--green-bg,rgba(0,200,120,.08))',border:'1px solid var(--green-bd,var(--border))'}}>
            <div style={{fontSize:12,marginBottom:6}}>
              ✅ Usuário <b>{genPass.email}</b> criado. Senha inicial (compartilhe agora, ela não fica visível depois):
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <code className="mono" style={{fontSize:14,fontWeight:700,letterSpacing:1}}>{genPass.password}</code>
              <button className="btn btn-ghost" style={{fontSize:11}} onClick={copyGenPass}>Copiar</button>
            </div>
          </div>
        )}
        <div style={{fontSize:12,color:'var(--text3)',marginTop:8}}>
          A senha inicial é gerada automaticamente. Compartilhe com o convidado por
          um canal seguro (ex: WhatsApp). Não há envio automático de email neste sistema.
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>👥 Usuários ({data.users.length})</div>
        {data.users.length===0
          ? <div className="text3">Nenhum usuário ainda.</div>
          : <table className="tbl">
              <thead><tr>
                <th>Email</th><th>Apostas</th><th>Acerto</th>
                <th style={{textAlign:'right'}}>Lucro</th><th>Cadastro</th><th></th>
              </tr></thead>
              <tbody>
                {data.users.map(u=>(
                  <React.Fragment key={u.id}>
                    <tr>
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
                      <td style={{textAlign:'right'}}>
                        <button className="btn btn-ghost" style={{fontSize:11}}
                          onClick={()=>resetTarget===u.id?cancelReset():openReset(u.id)}>
                          {resetTarget===u.id?'Cancelar':'Resetar senha'}
                        </button>
                      </td>
                    </tr>
                    {resetTarget===u.id&&(
                      <tr>
                        <td colSpan={6} style={{background:'var(--bg2)'}}>
                          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',padding:'8px 0'}}>
                            <input type="text" placeholder="nova senha (min. 8 caracteres)" style={{flex:1,minWidth:200}}
                              value={resetPass} onChange={e=>setResetPass(e.target.value)}
                              onKeyDown={e=>e.key==='Enter'&&confirmReset()} autoFocus />
                            <button className="btn btn-primary" style={{fontSize:11}}
                              onClick={confirmReset} disabled={resetBusy||resetPass.length<8}>
                              {resetBusy?'Salvando…':'Confirmar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}
