// Revisado: versão Firebase sem RegistroFluxo
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.database();
let ultimoFluxo = {};

// ✅ POST: recebe dados de fluxo
router.post('/', async (req, res) => {
  const { litrosReal, sensorOnline, fluxoAtivo } = req.body;

  if (typeof litrosReal !== 'number') {
    console.log('❌ Dados inválidos recebidos em /fluxo:', req.body);
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  try {
    const ref = db.ref('fluxo').push();
    const id = ref.key;

    const novoFluxo = {
      id,
      litrosReal,
      sensorOnline: !!sensorOnline,
      fluxoAtivo: !!fluxoAtivo,
      timestamp: new Date().toISOString()
    };

    await db.ref(`fluxo/${id}`).set(novoFluxo);
    ultimoFluxo = novoFluxo;

    console.log('✅ Fluxo salvo no Firebase:', novoFluxo);
    res.status(200).json(novoFluxo);
  } catch (erro) {
    console.error('❌ Erro ao salvar em /fluxo:', erro);
    res.status(500).send('Erro ao salvar fluxo no Firebase.');
  }
});

// ✅ GET: consulta último fluxo
router.get('/', (req, res) => {
  if (ultimoFluxo.litrosReal !== undefined) {
    res.json(ultimoFluxo);
  } else {
    res.status(404).json({ erro: 'Nenhum fluxo disponível ainda.' });
  }
});

// ✅ GET: total por dia
router.get('/total-dia', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const snapshot = await db.ref('fluxo').orderByChild('timestamp')
      .startAt(hoje.toISOString())
      .endAt(amanha.toISOString())
      .once('value');

    let total = 0;
    if (snapshot.exists()) {
      const registros = Object.values(snapshot.val());
      total = registros.reduce((soma, r) => soma + (r.litrosReal || 0), 0);
    }

    res.json({ totalHoje: total.toFixed(2) });
  } catch (erro) {
    console.error('❌ Erro ao calcular total-dia:', erro);
    res.status(500).json({ erro: 'Erro ao calcular total-dia' });
  }
});

module.exports = router;