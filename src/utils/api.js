import { supabase } from './supabase';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const signIn      = (email, password) => supabase.auth.signInWithPassword({ email, password });
export const signOut     = () => supabase.auth.signOut();
export const getSession  = () => supabase.auth.getSession();
export const inviteUser  = (email) => supabase.auth.admin.inviteUserByEmail(email); // só funciona com service_role key

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings() {
  const { data } = await supabase.from('settings').select('*');
  const map = {};
  (data||[]).forEach(r => { map[r.key] = r.value; });
  if (!map.bankroll)     map.bankroll     = '1000';
  if (!map.streak_alert) map.streak_alert = '3';
  return map;
}

export async function saveSettings(obj) {
  const { data: { user } } = await supabase.auth.getUser();
  const rows = Object.entries(obj).map(([key,value]) => ({ user_id: user.id, key, value: String(value) }));
  return supabase.from('settings').upsert(rows, { onConflict: 'user_id,key' });
}

// ─── Tipsters ─────────────────────────────────────────────────────────────────
export async function getTipsters() {
  const { data } = await supabase.from('tipsters').select('*').order('name');
  return data || [];
}

export async function createTipster(obj) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('tipsters').insert({ ...obj, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function updateTipster(id, obj) {
  const { data, error } = await supabase.from('tipsters').update(obj).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTipster(id) {
  await supabase.from('bets').update({ tipster_id: null }).eq('tipster_id', id);
  return supabase.from('tipsters').delete().eq('id', id);
}

export async function getTipsterStats() {
  const tipsters = await getTipsters();
  const { data: bets } = await supabase.from('bets').select('*');
  return tipsters.map(t => {
    const tb      = (bets||[]).filter(b => b.tipster_id === t.id);
    const settled = tb.filter(b => b.result==='won'||b.result==='lost');
    const won     = settled.filter(b => b.result==='won');
    const profit  = settled.reduce((s,b) => s + calcProfit(b), 0);
    const stake   = settled.reduce((s,b) => s + parseFloat(b.stake), 0);
    return { ...t, total:tb.length, settled:settled.length, won:won.length,
      profit:+profit.toFixed(2), roi:stake>0?+(profit/stake*100).toFixed(1):0,
      winRate:settled.length>0?+(won.length/settled.length*100).toFixed(1):0 };
  });
}

// ─── Bets ─────────────────────────────────────────────────────────────────────
function calcProfit(b) {
  const odd = parseFloat(b.odd), stake = parseFloat(b.stake);
  if (b.result==='won')  return +(stake*(odd-1)).toFixed(2);
  if (b.result==='lost') return -stake;
  return 0;
}

async function hydrateBets(bets) {
  if (!bets?.length) return [];
  const ids = bets.filter(b=>b.type==='multiple').map(b=>b.id);
  let legsMap = {};
  if (ids.length) {
    const { data: legs } = await supabase.from('bet_legs').select('*').in('bet_id', ids);
    (legs||[]).forEach(l => { if (!legsMap[l.bet_id]) legsMap[l.bet_id]=[]; legsMap[l.bet_id].push(l); });
  }
  const tipIds = [...new Set(bets.filter(b=>b.tipster_id).map(b=>b.tipster_id))];
  let tipMap = {};
  if (tipIds.length) {
    const { data: tips } = await supabase.from('tipsters').select('*').in('id', tipIds);
    (tips||[]).forEach(t => { tipMap[t.id]=t; });
  }
  return bets.map(b => ({ ...b, legs: legsMap[b.id]||[], tipster: tipMap[b.tipster_id]||null }));
}

export async function getBets(filters={}) {
  let q = supabase.from('bets').select('*').order('date',{ascending:false}).order('id',{ascending:false});
  if (filters.result && filters.result!=='all') q = q.eq('result', filters.result);
  if (filters.sport  && filters.sport !=='all') q = q.eq('sport',  filters.sport);
  if (filters.type   && filters.type  !=='all') q = q.eq('type',   filters.type);
  if (filters.tipster_id) q = q.eq('tipster_id', filters.tipster_id);
  const { data } = await q;
  return hydrateBets(data||[]);
}

export async function createBet(obj) {
  const { data: { user } } = await supabase.auth.getUser();
  const { legs, ...bet } = obj;
  const ep = bet.estimated_prob || null;
  const is_value = !!(ep && parseFloat(bet.odd) > 1/ep);
  const { data, error } = await supabase.from('bets')
    .insert({ ...bet, user_id: user.id, estimated_prob: ep, is_value }).select().single();
  if (error) throw error;
  if (bet.type==='multiple' && legs?.length) {
    await supabase.from('bet_legs').insert(legs.map(l=>({ bet_id:data.id, ...l })));
  }
  return data;
}

export async function updateBet(id, obj) {
  const { legs, ...bet } = obj;
  const ep = bet.estimated_prob !== undefined ? bet.estimated_prob : null;
  const is_value = !!(ep && parseFloat(bet.odd) > 1/ep);
  const { data, error } = await supabase.from('bets')
    .update({ ...bet, estimated_prob: ep, is_value }).eq('id', id).select().single();
  if (error) throw error;
  if (legs) {
    await supabase.from('bet_legs').delete().eq('bet_id', id);
    if (legs.length) await supabase.from('bet_legs').insert(legs.map(l=>({ bet_id:id, ...l })));
  }
  return data;
}

export async function deleteBet(id) {
  await supabase.from('bet_legs').delete().eq('bet_id', id);
  return supabase.from('bets').delete().eq('id', id);
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export async function getStats() {
  const [{ data: allBets }, settings] = await Promise.all([
    supabase.from('bets').select('*').order('date',{ascending:true}).order('id',{ascending:true}),
    getSettings(),
  ]);
  const bets        = allBets || [];
  const settled     = bets.filter(b=>b.result!=='pending'&&b.result!=='void');
  const won         = settled.filter(b=>b.result==='won');
  const totalStake  = settled.reduce((s,b)=>s+parseFloat(b.stake),0);
  const totalProfit = settled.reduce((s,b)=>s+calcProfit(b),0);
  const roi         = totalStake>0?(totalProfit/totalStake*100):0;
  const winRate     = settled.length>0?(won.length/settled.length*100):0;
  const avgOdd      = settled.length>0?settled.reduce((s,b)=>s+parseFloat(b.odd),0)/settled.length:0;
  const initialBankroll = parseFloat(settings.bankroll||1000);
  const alertThreshold  = parseInt(settings.streak_alert||3);

  let running = initialBankroll;
  const history = [{ label:'Início', value:initialBankroll }];
  settled.forEach((b,i) => { running+=calcProfit(b); history.push({label:`#${i+1}`,value:+running.toFixed(2),date:b.date}); });

  const monthlyMap = {};
  settled.forEach(b => {
    const ym = String(b.date).substring(0,7);
    if (!monthlyMap[ym]) monthlyMap[ym]={month:ym,profit:0,stake:0,won:0,total:0};
    monthlyMap[ym].profit+=calcProfit(b); monthlyMap[ym].stake+=parseFloat(b.stake); monthlyMap[ym].total++;
    if(b.result==='won') monthlyMap[ym].won++;
  });
  const monthlyArr = Object.values(monthlyMap).sort((a,b)=>a.month.localeCompare(b.month))
    .map(m=>({...m,profit:+m.profit.toFixed(2),roi:m.stake>0?+(m.profit/m.stake*100).toFixed(1):0}));

  const sportStats = {};
  bets.forEach(b=>{
    if(!sportStats[b.sport]) sportStats[b.sport]={count:0,profit:0,won:0,settled:0,stake:0};
    sportStats[b.sport].count++;
    if(b.result==='won'||b.result==='lost'){
      sportStats[b.sport].settled++; sportStats[b.sport].profit+=calcProfit(b); sportStats[b.sport].stake+=parseFloat(b.stake);
      if(b.result==='won') sportStats[b.sport].won++;
    }
  });

  const valueBets    = bets.filter(b=>b.is_value);
  const valueSettled = valueBets.filter(b=>b.result==='won'||b.result==='lost');
  const valueProfit  = valueSettled.reduce((s,b)=>s+calcProfit(b),0);

  const reversed=[...bets].reverse(); let streak=0,streakType=null;
  for(const b of reversed){ if(b.result==='pending'||b.result==='void') continue; if(!streakType){streakType=b.result;streak=1;}else if(b.result===streakType)streak++;else break; }

  return {
    total:bets.length, pending:bets.filter(b=>b.result==='pending').length,
    won:won.length, lost:settled.length-won.length, settled:settled.length,
    totalStake:+totalStake.toFixed(2), totalProfit:+totalProfit.toFixed(2),
    roi:+roi.toFixed(2), winRate:+winRate.toFixed(2), avgOdd:+avgOdd.toFixed(2),
    initialBankroll, currentBankroll:+(initialBankroll+totalProfit).toFixed(2),
    history, monthlyArr, sportStats,
    valueBets:{total:valueBets.length,settled:valueSettled.length,profit:+valueProfit.toFixed(2)},
    streak:{count:streak,type:streakType,alert:streak>=alertThreshold}, alertThreshold,
  };
}

// ─── Admin ─────────────────────────────────────────────────────────────────────
export async function getAdminStats() {
  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: allBets   } = await supabase.from('bets').select('*');
  const bets = allBets||[];
  const users = (profiles||[]).map(p => {
    const ub = bets.filter(b=>b.user_id===p.id);
    const settled = ub.filter(b=>b.result==='won'||b.result==='lost');
    const won     = settled.filter(b=>b.result==='won');
    const profit  = settled.reduce((s,b)=>s+calcProfit(b),0);
    return { ...p, total:ub.length, settled:settled.length, won:won.length,
      profit:+profit.toFixed(2), winRate:settled.length>0?+(won.length/settled.length*100).toFixed(1):0 };
  });
  return { users, totalBets:bets.length, totalUsers:(profiles||[]).length };
}
