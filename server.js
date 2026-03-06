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

// ✅ Rotas externas
const dadosRoutes = require('./routes/dados');
const fluxoRoutes = require('./routes/fluxo');

app.use('/dados', dadosRoutes);
app.use('/fluxo', fluxoRoutes);

/// ✅ Endpoint de verificação (últimos registros)
app.get('/verificar', async (req, res) => {
  try {
    const db = admin.database();

    // 🔹 gera chave do dia atual (yyyy-MM-dd)
    const hoje = new Date().toISOString().split("T")[0];

    // 🔹 busca último dado ambiental do dia
    const dadosSnapshot = await db.ref(`dados/${hoje}`).limitToLast(1).once('value');

    // 🔹 busca último fluxo (se também estiver organizado por dia, ajuste igual)
    const fluxoSnapshot = await db.ref('fluxo').limitToLast(1).once('value');

    const ultimoDadoFirebase = dadosSnapshot.exists()
      ? Object.values(dadosSnapshot.val())[0]
      : null;

    const ultimoFluxoFirebase = fluxoSnapshot.exists()
      ? Object.values(fluxoSnapshot.val())[0]
      : null;

    res.json({
      dados: ultimoDadoFirebase || 'Nenhum dado encontrado',
      fluxo: ultimoFluxoFirebase || 'Nenhum fluxo encontrado'
    });
  } catch (erro) {
    console.error('❌ Erro ao consultar dados do Firebase:', erro);
    res.status(500).send('Erro ao consultar dados do Firebase.');
  }
});

// ✅ Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});