require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔐 Verifica se a chave está presente
if (!process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Variável FIREBASE_PRIVATE_KEY não encontrada. Verifique o .env ou Render.');
  process.exit(1);
}

console.log('🔐 Chave detectada:', process.env.FIREBASE_PRIVATE_KEY.slice(0, 30));

// 🔐 Inicializa o Firebase Admin SDK com variáveis de ambiente
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: JSON.parse(`"${process.env.FIREBASE_PRIVATE_KEY}"`)
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

let ultimoDado = {};
let ultimoFluxo = {};

// POST: recebe dados ambientais
app.post('/dados', async (req, res) => {
  const { temperatura, umidade, eco2, tvoc } = req.body;

  if (
    typeof temperatura !== 'number' ||
    typeof umidade !== 'number' ||
    typeof eco2 !== 'number' ||
    typeof tvoc !== 'number'
  ) {
    console.log('❌ Dados inválidos recebidos em /dados:', req.body);
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  try {
    const ref = db.ref('dados').push();
    const id = ref.key;

    const novoDado = {
      id,
      temperatura,
      umidade,
      eco2,
      tvoc,
      timestamp: new Date().toISOString()
    };

    await db.ref(`dados/${id}`).set(novoDado);

    console.log('✅ Dados ambientais salvos com ID:', id);
    res.status(200).json(novoDado);
  } catch (erro) {
    console.error('❌ Erro ao salvar em /dados:', erro);
    res.status(500).send('Erro ao salvar dados no Firebase.');
  }
});

// DELETE: exclui dado por ID
app.delete('/dados/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const ref = db.ref(`dados/${id}`);
    const snapshot = await ref.once('value');

    if (!snapshot.exists()) {
      return res.status(404).send(`Registro com ID ${id} não encontrado.`);
    }

    await ref.remove();
    console.log(`🗑️ Registro com ID ${id} excluído do Firebase.`);
    res.status(200).send(`Registro com ID ${id} excluído com sucesso.`);
  } catch (erro) {
    console.error('❌ Erro ao excluir dado:', erro);
    res.status(500).send('Erro ao excluir dado do Firebase.');
  }
});

// GET: consulta dados ambientais
app.get('/dados', (req, res) => {
  if (ultimoDado.temperatura && ultimoDado.umidade) {
    const agora = new Date();
    const recebido = new Date(ultimoDado.timestamp);
    const segundos = (agora - recebido) / 1000;
    const online = segundos <= 75;

    const dataStr = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;

    res.json({ ...ultimoDado, data: dataStr, online });
  } else {
    res.status(404).json({ erro: 'Nenhum dado disponível ainda.' });
  }
});

// POST: recebe volume real de água
app.post('/fluxo', async (req, res) => {
  const { litrosReal, sensorOnline } = req.body;

  if (typeof litrosReal !== 'number') {
    console.log('❌ Dados inválidos recebidos em /fluxo:', req.body);
    return res.status(400).json({ erro: 'Dados de fluxo inválidos' });
  }

  ultimoFluxo = {
    litrosReal,
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

// GET: consulta fluxo de água
app.get('/fluxo', (req, res) => {
  if (ultimoFluxo.litrosReal !== undefined) {
    const agora = new Date();
    const recebido = new Date(ultimoFluxo.timestamp);
    const segundos = (agora - recebido) / 1000;
    const online = segundos <= 75;

    const dataStr = `${agora.getDate().toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}/${agora.getFullYear()}`;

    res.json({ ...ultimoFluxo, data: dataStr, online });
  } else {
    res.status(404).json({ erro: 'Nenhum dado de fluxo disponível ainda.' });
  }
});

// GET: consulta os últimos dados salvos no Firebase
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