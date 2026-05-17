import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../utils/api';

export default function Settings({ toast }) {
  const [bankroll, setBankroll]       = useState('');
  const [streakAlert, setStreakAlert] = useState('3');

  useEffect(()=>{
    getSettings().then(s=>{
      setBankroll(s.bankroll||'1000');
      setStreakAlert(s.streak_alert||'3');
    });
  }, []);

  const save = async() => {
    await saveSettings({ bankroll:parseFloat(bankroll), streak_alert:parseInt(streakAlert) });
    toast('Configurações salvas! ✓','success');
  };

  return (
    <div style={{maxWidth:500,display:'flex',flexDirection:'column',gap:16}}>
      <div className="card" style={{display:'flex',flexDirection:'column',gap:18}}>
        <div style={{fontWeight:700,fontSize:15}}>Configurações da Banca</div>

        <div className="form-group">
          <span className="form-label">Banca Inicial (R$)</span>
          <input type="number" step="0.01" min="0" value={bankroll}
            onChange={e=>setBankroll(e.target.value)} style={{maxWidth:200}} placeholder="1000.00" />
          <span className="form-hint">Referência para cálculo de ROI e evolução do bankroll.</span>
        </div>

        <div className="form-group">
          <span className="form-label">Alerta de Sequência (nº de derrotas)</span>
          <input type="number" step="1" min="2" max="20" value={streakAlert}
            onChange={e=>setStreakAlert(e.target.value)} style={{maxWidth:100}} />
          <span className="form-hint">Exibe alerta no dashboard quando atingir essa sequência de perdas consecutivas.</span>
        </div>

        <div>
          <button className="btn btn-primary" onClick={save}>Salvar configurações</button>
        </div>
      </div>

      <div className="card">
        <div style={{fontWeight:700,fontSize:15,marginBottom:10}}>Sobre o BetTracker Pro v2</div>
        <ul style={{color:'var(--text2)',fontSize:13,lineHeight:2,paddingLeft:16}}>
          <li>Backend: Node.js + Express + SQLite</li>
          <li>Frontend: React + Recharts</li>
          <li>Dados em: <code style={{background:'var(--surface2)',padding:'1px 6px',borderRadius:4,fontFamily:'monospace'}}>backend/bettracker.db</code></li>
          <li>API: <code style={{background:'var(--surface2)',padding:'1px 6px',borderRadius:4,fontFamily:'monospace'}}>http://localhost:3001/api</code></li>
        </ul>
      </div>
    </div>
  );
}
