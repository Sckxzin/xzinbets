const express = require('express');
const { pool } = require('../db');
const { requireAuth } = require('../auth');
const { buildStats } = require('../stats');
const { validateBet } = require('../validate');

const router = express.Router();
router.use(requireAuth);

async function hydrateBets(bets, userId) {
  if (!bets.length) return [];
  const multiIds = bets.filter(b => b.type === 'multiple').map(b => b.id);
  let legsMap = {};
  if (multiIds.length) {
    const { rows: legs } = await pool.query('SELECT * FROM bet_legs WHERE bet_id = ANY($1)', [multiIds]);
    legs.forEach(l => { (legsMap[l.bet_id] ||= []).push(l); });
  }
  const tipIds = [...new Set(bets.filter(b => b.tipster_id).map(b => b.tipster_id))];
  let tipMap = {};
  if (tipIds.length) {
    const { rows: tips } = await pool.query('SELECT * FROM tipsters WHERE id = ANY($1) AND user_id = $2', [tipIds, userId]);
    tips.forEach(t => { tipMap[t.id] = t; });
  }
  return bets.map(b => ({ ...b, legs: legsMap[b.id] || [], tipster: tipMap[b.tipster_id] || null }));
}

router.get('/', async (req, res) => {
  const { result, sport, type, tipster_id } = req.query;
  const clauses = ['user_id = $1'];
  const params = [req.user.id];
  if (result && result !== 'all')     { params.push(result);     clauses.push(`result = $${params.length}`); }
  if (sport  && sport  !== 'all')     { params.push(sport);      clauses.push(`sport = $${params.length}`); }
  if (type   && type   !== 'all')     { params.push(type);       clauses.push(`type = $${params.length}`); }
  if (tipster_id)                     { params.push(tipster_id); clauses.push(`tipster_id = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT * FROM bets WHERE ${clauses.join(' AND ')} ORDER BY date DESC, id DESC`,
    params
  );
  res.json(await hydrateBets(rows, req.user.id));
});

router.get('/stats', async (req, res) => {
  const { rows: bets } = await pool.query('SELECT * FROM bets WHERE user_id = $1 ORDER BY date ASC, id ASC', [req.user.id]);
  const { rows: settingsRows } = await pool.query('SELECT key, value FROM settings WHERE user_id = $1', [req.user.id]);
  const settings = {};
  settingsRows.forEach(r => { settings[r.key] = r.value; });
  res.json(buildStats(bets, settings));
});

router.post('/', async (req, res) => {
  const body = req.body || {};
  const b = { ...body, type: body.type || 'single', result: body.result || 'pending', notes: body.notes || '' };

  const errors = validateBet(b);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const ep = b.estimated_prob || null;
  const isValue = !!(ep && parseFloat(b.odd) > 1 / ep);

  const { rows } = await pool.query(
    `INSERT INTO bets (user_id, type, sport, description, house, market, odd, stake, date, result, notes, tipster_id, estimated_prob, is_value)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [req.user.id, b.type, b.sport, b.description, b.house, b.market, b.odd, b.stake, b.date,
     b.result, b.notes, b.tipster_id || null, ep, isValue]
  );
  const bet = rows[0];

  if (b.type === 'multiple' && b.legs?.length) {
    for (const l of b.legs) {
      await pool.query(
        `INSERT INTO bet_legs (bet_id, description, sport, market, odd, result) VALUES ($1,$2,$3,$4,$5,$6)`,
        [bet.id, l.description, l.sport || b.sport, l.market || b.market, l.odd, l.result || 'pending']
      );
    }
  }
  res.status(201).json(bet);
});

router.put('/:id', async (req, res) => {
  const body = req.body || {};
  const b = { ...body, notes: body.notes || '' };

  const errors = validateBet(b);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });

  const ep = b.estimated_prob !== undefined ? (b.estimated_prob || null) : null;
  const isValue = !!(ep && parseFloat(b.odd) > 1 / ep);

  const { rows } = await pool.query(
    `UPDATE bets SET type=$1, sport=$2, description=$3, house=$4, market=$5, odd=$6, stake=$7, date=$8,
       result=$9, notes=$10, tipster_id=$11, estimated_prob=$12, is_value=$13
     WHERE id=$14 AND user_id=$15 RETURNING *`,
    [b.type, b.sport, b.description, b.house, b.market, b.odd, b.stake, b.date,
     b.result, b.notes || '', b.tipster_id || null, ep, isValue, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Aposta não encontrada.' });

  if (b.legs !== undefined) {
    await pool.query('DELETE FROM bet_legs WHERE bet_id = $1', [req.params.id]);
    for (const l of (b.legs || [])) {
      await pool.query(
        `INSERT INTO bet_legs (bet_id, description, sport, market, odd, result) VALUES ($1,$2,$3,$4,$5,$6)`,
        [req.params.id, l.description, l.sport, l.market, l.odd, l.result || 'pending']
      );
    }
  }
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query('DELETE FROM bets WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Aposta não encontrada.' });
  res.json({ ok: true });
});

module.exports = router;
