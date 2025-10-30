const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware para interpretar JSON
app.use(express.json());

// Variável para armazenar o último dado recebido
let ultimoDado = {};

// Rota POST para receber dados do ESP32
app.post('/dados', (req, res) => {
  const { temperatura, umidade } = req.body;

  // Armazena os dados recebidos
  ultimoDado = {
    temperatura,
    umidade,
    timestamp: new Date().toISOString()
  };

  console.log(`📡 Dados recebidos: ${temperatura} °C, ${umidade} %`);
  res.send('Dados recebidos com sucesso!');
});

// Rota GET para seu app acessar os dados
app.get('/dados', (req, res) => {
  if (ultimoDado.temperatura && ultimoDado.umidade) {
    res.json(ultimoDado);
  } else {
    res.status(404).json({ erro: 'Nenhum dado disponível ainda.' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});