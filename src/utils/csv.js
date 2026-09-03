function escapeCSVField(value) {
  const s = String(value ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCSV(filename, headers, rows) {
  const lines = [headers, ...rows].map(row => row.map(escapeCSVField).join(';'));
  const csv = '﻿' + lines.join('\r\n'); // BOM p/ abrir certo com acentos no Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportBetsCSV(bets) {
  const headers = ['Data', 'Esporte', 'Descrição', 'Casa', 'Mercado', 'Tipo', 'Odd', 'Stake', 'Resultado', 'Lucro', 'Tipster', 'Observações'];
  const rows = bets.map(b => {
    const profit = b.result === 'won' ? +(b.stake * (b.odd - 1)).toFixed(2)
      : b.result === 'lost' ? -parseFloat(b.stake) : 0;
    return [
      String(b.date).substring(0, 10),
      b.sport,
      b.description,
      b.house,
      b.market,
      b.type === 'multiple' ? 'Múltipla' : 'Simples',
      b.odd,
      b.stake,
      b.result,
      profit.toFixed(2),
      b.tipster?.name || '',
      b.notes || '',
    ];
  });
  downloadCSV(`apostas_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}
