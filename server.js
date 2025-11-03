const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔐 Inicializa o Firebase Admin SDK com variáveis de ambiente
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// Armazena o último dado de temperatura/umidade
let ultimoDado = {};

// Armazena o último dado de fluxo de água
let ultimoFluxo = {};

// Rota POST: recebe temperatura e umidade
app.post('/dados', async (req, res) => {
  const { temperatura, umidade } = req.body;

  if (typeof temperatura !== 'number' || typeof umidade !== 'number') {
    console.log('❌ Dados inválidos recebidos em /dados:', req.body);
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  ultimoDado = {
    temperatura,
    umidade,
    timestamp: new Date().toISOString()
  };

  try {
    await db.ref('dados').push(ultimoDado);
    console.log('✅ Dado salvo no Firebase:', ultimoDado);
    res.send('Dados de temperatura/umidade recebidos com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao salvar em /dados:', erro);
    res.status(500).send('Erro ao salvar dados no Firebase.');
  }
});

// Rota GET: consulta temperatura e umidade
app.get('/dados', (req, res) => {
  if (ultimoDado.temperatura && ultimoDado.umidade) {
    const agora = new Date();
    const recebido = new Date(ultimoDado.timestamp);
    const segundos = (agora - recebido) / 1000;
    const online = segundos <= 15;

    const dataStr = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;

    res.json({ ...ultimoDado, data: dataStr, online });
  } else {
    res.status(404).json({ erro: 'Nenhum dado disponível ainda.' });
  }
});

// Rota POST: recebe fluxo de água
app.post('/fluxo', async (req, res) => {
  const { litrosPorMinuto, sensorOnline } = req.body;

  if (typeof litrosPorMinuto !== 'number') {
    console.log('❌ Dados inválidos recebidos em /fluxo:', req.body);
    return res.status(400).json({ erro: 'Dados de fluxo inválidos' });
  }

  ultimoFluxo = {
    litrosPorMinuto,
    sensorOnline: !!sensorOnline,
    timestamp: new Date().toISOString()
  };

  try {
    await db.ref('fluxo').push(ultimoFluxo);
    console.log('✅ Fluxo salvo no Firebase:', ultimoFluxo);
    res.send('Dados de fluxo recebidos com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao salvar em /fluxo:', erro);
    res.status(500).send('Erro ao salvar dados no Firebase.');
  }
});

// Rota GET: consulta fluxo de água
app.get('/fluxo', (req, res) => {
  if (ultimoFluxo.litrosPorMinuto !== undefined) {
    const agora = new Date();
    const recebido = new Date(ultimoFluxo.timestamp);
    const segundos = (agora - recebido) / 1000;
    const online = segundos <= 15;

    const dataStr = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;

    res.json({ ...ultimoFluxo, data: dataStr, online });
  } else {
    res.status(404).json({ erro: 'Nenhum dado de fluxo disponível ainda.' });
  }
});

// Rota GET: envia dados de teste para o Firebase
app.get('/teste', async (req, res) => {
  const dadosTeste = {
    temperatura: 25.5,
    umidade: 60.2,
    litrosPorMinuto: 4.8,
    sensorOnline: true,
    timestamp: new Date().toISOString()
  };

  try {
    await db.ref('testeManual').push(dadosTeste);
    console.log('✅ Dados de teste enviados ao Firebase:', dadosTeste);
    res.send('Dados de teste enviados com sucesso!');
  } catch (erro) {
    console.error('❌ Erro ao enviar dados de teste:', erro);
    res.status(500).send('Erro ao enviar dados de teste.');
  }
});

// Rota GET: consulta os últimos dados salvos no Firebase
app.get('/verificar', async (req, res) => {
  try {
    const dadosSnapshot = await db.ref('dados').limitToLast(1).once('value');
    const fluxoSnapshot = await db.ref('fluxo').limitToLast(1).once('value');

    const ultimoDadoFirebase = dadosSnapshot.exists() ? Object.values(dadosSnapshot.val())[0] : null;
    const ultimoFluxoFirebase = fluxoSnapshot.exists() ? Object.values(fluxoSnapshot.val())[0] : null;

    res.json({
      dados: ultimoDadoFirebase || 'Nenhum dado encontrado',
      fluxo: ultimoFluxoFirebase || 'Nenhum fluxo encontrado'
    });
  } catch (erro) {
    console.error('❌ Erro ao consultar dados do Firebase:', erro);
    res.status(500).send('Erro ao consultar dados do Firebase.');
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});