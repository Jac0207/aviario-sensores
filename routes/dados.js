const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.database();
let ultimoDado = {};

// POST: recebe dados ambientais
router.post('/', async (req, res) => {
  const { temperatura, umidade, eco2, tvoc, sensorOnline } = req.body;

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
      sensorOnline: !!sensorOnline, // ✅ salva também
      timestamp: new Date().toISOString()
    };

    await db.ref(`dados/${id}`).set(novoDado);
    ultimoDado = novoDado;

    console.log('✅ Dados ambientais salvos com ID:', id);
    res.status(200).json(novoDado);
  } catch (erro) {
    console.error('❌ Erro ao salvar em /dados:', erro);
    res.status(500).send('Erro ao salvar dados no Firebase.');
  }
});

// GET: consulta dados ambientais
router.get('/', (req, res) => {
  if (ultimoDado.temperatura && ultimoDado.umidade) {
    const agora = new Date();
    const recebido = new Date(ultimoDado.timestamp);
    const segundos = (agora - recebido) / 1000;
    const online = segundos <= 75;

    const dataStr = `${agora.getDate().toString().padStart(2, '0')}/${
      (agora.getMonth() + 1).toString().padStart(2, '0')
    }/${agora.getFullYear()}`;

    res.json({
      ...ultimoDado,
      data: dataStr,
      online,
      sensorOnline: ultimoDado.sensorOnline === true // ✅ retorna também
    });
  } else {
    res.status(404).json({ erro: 'Nenhum dado disponível ainda.' });
  }
});

module.exports = router;