import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL;

export const SPORTS = [
  { id:'Futebol',   emoji:'⚽', color:'#176b3e' },
  { id:'Basquete',  emoji:'🏀', color:'#c05200' },
  { id:'Tênis',     emoji:'🎾', color:'#6b2fa0' },
  { id:'Vôlei',     emoji:'🏐', color:'#1a4fa0' },
  { id:'MMA',       emoji:'🥊', color:'#b52b2b' },
  { id:'F1',        emoji:'🏎️', color:'#1a1a2e' },
  { id:'Americano', emoji:'🏈', color:'#6b4423' },
  { id:'Outro',     emoji:'🎯', color:'#6b6a63' },
];
export const SPORT_MAP = Object.fromEntries(SPORTS.map(s=>[s.id,s]));

export const HOUSES  = ['Bet365','Betfair','KTO','Superbet','Novibet','Sportingbet','Pixbet','Betano','Outras'];
export const MARKETS = ['Resultado (1X2)','Ambas Marcam','Over/Under','Handicap Asiático','Handicap Europeu','Vencedor','Placar Correto','Primeiro Gol','Dupla Chance','Outro'];

export const RESULT_LABELS = {
  won:     { label:'Ganhou',   cls:'won'     },
  lost:    { label:'Perdeu',   cls:'lost'    },
  pending: { label:'Pendente', cls:'pending' },
  void:    { label:'Void',     cls:'void'    },
};
