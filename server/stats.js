function calcProfit(b) {
  const odd = parseFloat(b.odd), stake = parseFloat(b.stake);
  if (b.result === 'won')  return +(stake * (odd - 1)).toFixed(2);
  if (b.result === 'lost') return -stake;
  return 0;
}

function buildStats(bets, settings) {
  const settled     = bets.filter(b => b.result !== 'pending' && b.result !== 'void');
  const won         = settled.filter(b => b.result === 'won');
  const totalStake  = settled.reduce((s, b) => s + parseFloat(b.stake), 0);
  const totalProfit = settled.reduce((s, b) => s + calcProfit(b), 0);
  const roi         = totalStake > 0 ? (totalProfit / totalStake * 100) : 0;
  const winRate     = settled.length > 0 ? (won.length / settled.length * 100) : 0;
  const avgOdd      = settled.length > 0 ? settled.reduce((s, b) => s + parseFloat(b.odd), 0) / settled.length : 0;
  const initialBankroll = parseFloat(settings.bankroll || 1000);
  const alertThreshold  = parseInt(settings.streak_alert || 3);
  const goal            = parseFloat(settings.goal || 0);

  let running = initialBankroll;
  const history = [{ label: 'Início', value: initialBankroll }];
  settled.forEach((b, i) => { running += calcProfit(b); history.push({ label: `#${i + 1}`, value: +running.toFixed(2), date: b.date }); });

  const monthlyMap = {};
  settled.forEach(b => {
    const ym = String(b.date).substring(0, 7);
    if (!monthlyMap[ym]) monthlyMap[ym] = { month: ym, profit: 0, stake: 0, won: 0, total: 0 };
    monthlyMap[ym].profit += calcProfit(b); monthlyMap[ym].stake += parseFloat(b.stake); monthlyMap[ym].total++;
    if (b.result === 'won') monthlyMap[ym].won++;
  });
  const monthlyArr = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month))
    .map(m => ({ ...m, profit: +m.profit.toFixed(2), roi: m.stake > 0 ? +(m.profit / m.stake * 100).toFixed(1) : 0 }));

  const sportStats = {};
  bets.forEach(b => {
    if (!sportStats[b.sport]) sportStats[b.sport] = { count: 0, profit: 0, won: 0, settled: 0, stake: 0 };
    sportStats[b.sport].count++;
    if (b.result === 'won' || b.result === 'lost') {
      sportStats[b.sport].settled++; sportStats[b.sport].profit += calcProfit(b); sportStats[b.sport].stake += parseFloat(b.stake);
      if (b.result === 'won') sportStats[b.sport].won++;
    }
  });

  const houseStats = {};
  bets.forEach(b => {
    if (!houseStats[b.house]) houseStats[b.house] = { count: 0, profit: 0, won: 0, settled: 0 };
    houseStats[b.house].count++;
    if (b.result === 'won' || b.result === 'lost') {
      houseStats[b.house].settled++; houseStats[b.house].profit += calcProfit(b);
      if (b.result === 'won') houseStats[b.house].won++;
    }
  });

  const valueBets    = bets.filter(b => b.is_value);
  const valueSettled = valueBets.filter(b => b.result === 'won' || b.result === 'lost');
  const valueProfit  = valueSettled.reduce((s, b) => s + calcProfit(b), 0);

  const reversed = [...bets].reverse(); let streak = 0, streakType = null;
  for (const b of reversed) {
    if (b.result === 'pending' || b.result === 'void') continue;
    if (!streakType) { streakType = b.result; streak = 1; }
    else if (b.result === streakType) streak++;
    else break;
  }

  const currentBankroll = +(initialBankroll + totalProfit).toFixed(2);
  const goalProgress    = goal > 0 ? Math.min(+((currentBankroll / goal) * 100).toFixed(1), 100) : 0;
  const goalReached     = goal > 0 && currentBankroll >= goal;
  const goalNear        = goal > 0 && !goalReached && goalProgress >= 80;

  return {
    total: bets.length, pending: bets.filter(b => b.result === 'pending').length,
    won: won.length, lost: settled.length - won.length, settled: settled.length,
    totalStake: +totalStake.toFixed(2), totalProfit: +totalProfit.toFixed(2),
    roi: +roi.toFixed(2), winRate: +winRate.toFixed(2), avgOdd: +avgOdd.toFixed(2),
    initialBankroll, currentBankroll,
    goal, goalProgress, goalReached, goalNear,
    history, monthlyArr, sportStats, houseStats,
    valueBets: { total: valueBets.length, settled: valueSettled.length, profit: +valueProfit.toFixed(2) },
    streak: { count: streak, type: streakType, alert: streak >= alertThreshold }, alertThreshold,
  };
}

module.exports = { calcProfit, buildStats };
