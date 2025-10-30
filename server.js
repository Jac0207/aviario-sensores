const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post('/dados', (req, res) => {
  const { temperatura, umidade } = req.body;
  console.log(`📡 Dados recebidos: ${temperatura} °C, ${umidade} %`);
  res.send('Dados recebidos com sucesso!');
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});