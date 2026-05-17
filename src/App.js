import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { signOut, createBet, updateBet, getTipsters } from './utils/api';
import LoginPage  from './pages/LoginPage';
import Dashboard  from './pages/Dashboard';
import BetsList   from './pages/BetsList';
import Analysis   from './pages/Analysis';
import Tipsters   from './pages/Tipsters';
import Settings   from './pages/Settings';
import AdminPage  from './pages/AdminPage';
import BetModal   from './components/BetModal';
import { useToast } from './hooks/useToast';

const NAV_ITEMS = [
  { id:'dashboard', label:'Dashboard',   icon:'◼' },
  { id:'bets',      label:'Apostas',     icon:'≡' },
  { id:'analysis',  label:'Análise',     icon:'↗' },
  { id:'tipsters',  label:'Tipsters',    icon:'📋' },
  { id:'settings',  label:'Config',      icon:'⚙' },
];

function AppInner() {
  const { user, loading, isAdmin } = useAuth();
  const [page, setPage]          = useState('dashboard');
  const [modal, setModal]        = useState(false);
  const [editBet, setEditBet]    = useState(null);
  const [refreshKey, setRefresh] = useState(0);
  const [tipsters, setTipsters]  = useState([]);
  const { toasts, toast }        = useToast();

  const refresh = useCallback(() => setRefresh(k => k + 1), []);

  useEffect(() => { if (user) getTipsters().then(setTipsters); }, [user, refreshKey]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#000' }}>
      <div style={{ fontFamily:'Orbitron,monospace', fontSize:12, color:'rgba(0,170,255,0.5)', letterSpacing:3 }}>
        CARREGANDO...
      </div>
    </div>
  );

  if (!user) return <LoginPage />;

  const openNew    = () => { setEditBet(null); setModal(true); };
  const openEdit   = (b) => { setEditBet(b);   setModal(true); };
  const closeModal = () => { setModal(false); setEditBet(null); };

  const handleSave = async (data) => {
    if (editBet) { await updateBet(editBet.id, data); toast('Aposta atualizada! ✓', 'success'); }
    else         { await createBet(data);              toast('Aposta adicionada! ✓', 'success'); }
    closeModal(); refresh();
  };

  const nav = [...NAV_ITEMS, ...(isAdmin ? [{ id:'admin', label:'Admin', icon:'🛡' }] : [])];
  const pageLabel = nav.find(n => n.id === page)?.label || '';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#000' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">⚔️ XZINBETS</div>
          <div className="sidebar-logo-sub">O impossível é só o começo.</div>
        </div>

        {/* User */}
        <div style={{ padding:'10px 18px 10px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:10, color:'var(--text3)', marginBottom:3 }}>Logado como</div>
          <div style={{ fontSize:11, color:'var(--accent)', fontWeight:600,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {user.email}
          </div>
          {isAdmin && <div style={{ fontSize:9, color:'#ffd700', marginTop:2, letterSpacing:1 }}>🛡 ADMINISTRADOR</div>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {nav.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        {/* Rosa azul watermark */}
        <div className="rose-watermark">🌹🌹🌹</div>

        {/* Footer sidebar */}
        <div className="sidebar-footer">
          <button className="btn btn-primary" onClick={openNew}
            style={{ width:'100%', justifyContent:'center', marginBottom:8 }}>
            + NOVA APOSTA
          </button>
          <button className="btn btn-ghost" onClick={() => signOut()}
            style={{ width:'100%', justifyContent:'center', fontSize:10, opacity:.5 }}>
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">{pageLabel}</div>
          <button className="btn btn-primary" onClick={openNew}>+ Nova Aposta</button>
        </div>

        {/* Page */}
        <div className="page-content">
          {page==='dashboard' && <Dashboard refreshKey={refreshKey} onNewBet={openNew} />}
          {page==='bets'      && <BetsList  refreshKey={refreshKey} tipsters={tipsters} onEdit={openEdit} onRefresh={refresh} toast={toast} />}
          {page==='analysis'  && <Analysis  refreshKey={refreshKey} />}
          {page==='tipsters'  && <Tipsters  refreshKey={refreshKey} onTipstersChange={setTipsters} toast={toast} />}
          {page==='settings'  && <Settings  toast={toast} />}
          {page==='admin' && isAdmin  && <AdminPage />}
          {page==='admin' && !isAdmin && <div style={{ padding:40, color:'var(--red)', fontSize:13 }}>Acesso negado.</div>}
        </div>

        {/* ── Footer copyright ── */}
        <footer className="app-footer">
          <div className="footer-copy">
            © XzinTech — Todos os direitos reservados
          </div>
          <div className="footer-rose">
            <span>🌹</span>
            <span style={{ color:'var(--text3)' }}>A rosa azul — </span>
            <span>"O impossível é só o começo."</span>
          </div>
        </footer>
      </div>

      {/* Modal */}
      {modal && <BetModal bet={editBet} tipsters={tipsters} onSave={handleSave} onClose={closeModal} />}

      {/* Toasts */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppInner /></AuthProvider>;
}
