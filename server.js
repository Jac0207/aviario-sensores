const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Armazena o último dado recebido
let ultimoDado = {};

// Rota POST: recebe dados do ESP32
app.post('/dados', (req, res) => {
  const { temperatura, umidade } = req.body;

  if (typeof temperatura !== 'number' || typeof umidade !== 'number') {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  ultimoDado = {
    temperatura,
    umidade,
    timestamp: new Date().toISOString()
  };

  console.log(`📡 Dados recebidos: ${temperatura} °C, ${umidade} %`);
  res.send('Dados recebidos com sucesso!');
});

// Rota GET: consulta os dados no app
app.get('/dados', (req, res) => {
  if (ultimoDado.temperatura && ultimoDado.umidade) {
    const agora = new Date();
    const recebido = new Date(ultimoDado.timestamp);
    const segundos = (agora - recebido) / 1000;
    const online = segundos <= 15;

    const dataStr = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth()+1).toString().padStart(2, '0')}/${agora.getFullYear()}`;

    res.json({ ...ultimoDado, data: dataStr, online });
  } else {
    res.status(404).json({ erro: 'Nenhum dado disponível ainda.' });
  }
});

// Inicializa o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});