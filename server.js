const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve os arquivos estáticos do build do React
app.use(express.static(path.join(__dirname, 'build')));

// Qualquer rota vai para o index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ BetTracker rodando na porta ${PORT}`);
});
