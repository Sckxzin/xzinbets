import React, { useEffect, useState } from 'react';
import { getSettings, saveSettings, changePassword } from '../utils/api';

export default function Settings({ toast }) {
  const [bankroll,     setBankroll]     = useState('');
  const [streakAlert,  setStreakAlert]  = useState('3');
  const [goal,         setGoal]         = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwBusy,          setPwBusy]          = useState(false);

  useEffect(() => {
    getSettings().then(s => {
      setBankroll(s.bankroll || '1000');
      setStreakAlert(s.streak_alert || '3');
      setGoal(s.goal || '');
    }).catch(console.error);
  }, []);

  const save = async () => {
    await saveSettings({
      bankroll:     parseFloat(bankroll),
      streak_alert: parseInt(streakAlert),
      goal:         goal ? parseFloat(goal) : '',
    });
    toast('Configurações salvas! ✓', 'success');
  };

  const savePassword = async () => {
    if (newPassword !== confirmPassword) { toast('As senhas novas não coincidem.', 'error'); return; }
    setPwBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast('Senha alterada! ✓', 'success');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      toast(err.message, 'error');
    }
    setPwBusy(false);
  };

  return (
    <div style={{maxWidth:500,display:'flex',flexDirection:'column',gap:16}}>
      <div className="card" style={{display:'flex',flexDirection:'column',gap:20}}>
        <div style={{fontFamily:'var(--font-brand)',fontSize:12,color:'var(--accent)',letterSpacing:2}}>
          CONFIGURAÇÕES DA BANCA
        </div>

        <div className="form-group">
          <span className="form-label">Banca Inicial (R$)</span>
          <input type="number" step="0.01" min="0" value={bankroll}
            onChange={e=>setBankroll(e.target.value)} style={{maxWidth:200}} placeholder="1000.00" />
          <span className="form-hint">Referência para cálculo de ROI e evolução do bankroll.</span>
        </div>

        <div className="form-group">
          <span className="form-label">🎯 Meta de Banca (R$)</span>
          <input type="number" step="0.01" min="0" value={goal}
            onChange={e=>setGoal(e.target.value)} style={{maxWidth:200}} placeholder="Ex: 600.00" />
          <span className="form-hint">
            Define um objetivo. Ex: começou com R$ 100 e quer chegar em R$ 600.
            Uma barra de progresso aparece no dashboard. Deixe em branco para desativar.
          </span>
        </div>

        <div className="form-group">
          <span className="form-label">Alerta de Sequência (nº de derrotas)</span>
          <input type="number" step="1" min="2" max="20" value={streakAlert}
            onChange={e=>setStreakAlert(e.target.value)} style={{maxWidth:100}} />
          <span className="form-hint">
            Exibe alerta no dashboard após essa quantidade de derrotas seguidas.
          </span>
        </div>

        <div>
          <button className="btn btn-primary" onClick={save}>SALVAR CONFIGURAÇÕES</button>
        </div>
      </div>

      <div className="card" style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{fontFamily:'var(--font-brand)',fontSize:12,color:'var(--accent)',letterSpacing:2}}>
          TROCAR SENHA
        </div>

        <div className="form-group">
          <span className="form-label">Senha atual</span>
          <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
        </div>
        <div className="form-group">
          <span className="form-label">Nova senha</span>
          <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="mínimo 8 caracteres" />
        </div>
        <div className="form-group">
          <span className="form-label">Confirmar nova senha</span>
          <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
        </div>

        <div>
          <button className="btn btn-primary" onClick={savePassword}
            disabled={pwBusy||!currentPassword||!newPassword||!confirmPassword}>
            {pwBusy?'SALVANDO...':'TROCAR SENHA'}
          </button>
        </div>
      </div>

      <div className="card">
        <div style={{fontFamily:'var(--font-brand)',fontSize:12,color:'var(--accent)',letterSpacing:2,marginBottom:12}}>
          SOBRE O XZINBETS
        </div>
        <ul style={{color:'var(--text2)',fontSize:12,lineHeight:2.2,paddingLeft:16}}>
          <li>Frontend: React + Recharts</li>
          <li>Banco: PostgreSQL (Railway)</li>
          <li>Auth: própria (JWT) — acesso por convite</li>
          <li>Hospedagem: Railway</li>
        </ul>
        <div style={{marginTop:12,fontSize:11,color:'var(--text3)',fontStyle:'italic'}}>
          🌹 © XzinTech — Todos os direitos reservados
        </div>
      </div>
    </div>
  );
}
