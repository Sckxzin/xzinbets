import React from 'react';

export default function StreakAlert({ streak }) {
  if (!streak || !streak.alert || !streak.type) return null;

  const isLoss = streak.type === 'lost';
  const isWin  = streak.type === 'won';

  return (
    <div className={`alert ${isLoss ? 'alert-warning' : 'alert-success'}`}
      style={{ fontSize: 13, fontWeight: 500 }}>
      <span style={{ fontSize: 20 }}>{isLoss ? '⚠️' : '🔥'}</span>
      <div>
        {isLoss
          ? `Alerta: você está em uma sequência de ${streak.count} derrota${streak.count>1?'s':''} consecutiva${streak.count>1?'s':''}! Considere revisar suas estratégias.`
          : `Ótima fase! ${streak.count} vitória${streak.count>1?'s':''} consecutiva${streak.count>1?'s':''}! Continue assim! 🎯`
        }
      </div>
    </div>
  );
}
