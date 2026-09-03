require('dotenv').config();
require('express-async-errors');
const express      = require('express');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');
const path          = require('path');

const app  = express();
const PORT = process.env.PORT || 4000;

// crossOriginEmbedderPolicy fica desligado pois não usamos SharedArrayBuffer
// e ele pode bloquear os fonts do Google Fonts carregados via CSS.
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(express.json());
app.use(cookieParser());

app.use('/api', require('./server/routes'));

// Serve os arquivos estáticos do build do React (apenas quando existir,
// ex: em produção; em dev o front roda separado via `react-scripts start`)
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno no servidor.' });
});

app.listen(PORT, () => {
  console.log(`✅ BetTracker API rodando na porta ${PORT}`);
});
