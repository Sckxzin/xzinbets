const RESULTS = ['pending', 'won', 'lost', 'void'];
const TYPES   = ['single', 'multiple'];

function validateBet(b) {
  const errors = [];
  if (!b.sport)       errors.push('Esporte é obrigatório.');
  if (!b.description) errors.push('Descrição é obrigatória.');
  if (!b.house)        errors.push('Casa de apostas é obrigatória.');
  if (!b.market)       errors.push('Mercado é obrigatório.');

  const odd = parseFloat(b.odd);
  if (!Number.isFinite(odd) || odd < 1.01) errors.push('Odd deve ser um número maior que 1.');

  const stake = parseFloat(b.stake);
  if (!Number.isFinite(stake) || stake <= 0) errors.push('Stake deve ser um número maior que 0.');

  if (!b.date || Number.isNaN(Date.parse(b.date))) errors.push('Data inválida.');

  if (!RESULTS.includes(b.result)) errors.push('Resultado inválido.');
  if (!TYPES.includes(b.type))     errors.push('Tipo de aposta inválido.');

  if (b.estimated_prob !== undefined && b.estimated_prob !== null && b.estimated_prob !== '') {
    const ep = parseFloat(b.estimated_prob);
    if (!Number.isFinite(ep) || ep <= 0 || ep >= 1) errors.push('Probabilidade estimada deve estar entre 0 e 1.');
  }

  if (b.type === 'multiple' && b.legs?.length) {
    b.legs.forEach((l, i) => {
      if (!l.description) errors.push(`Perna ${i + 1}: descrição é obrigatória.`);
      const legOdd = parseFloat(l.odd);
      if (!Number.isFinite(legOdd) || legOdd < 1.01) errors.push(`Perna ${i + 1}: odd inválida.`);
    });
  }

  return errors;
}

module.exports = { validateBet };
