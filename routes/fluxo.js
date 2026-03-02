const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.database();
let ultimoFluxo = {};

// ✅ POST: recebe dados de fluxo e atualiza total do dia
router.post('/', async (req, res) => {
  const { litrosReal, fluxoAtivo } = req.body;

  if (typeof litrosReal !== 'number') {
    return res.status(400).json({ erro: 'litrosReal deve ser número' });
  }
  if (typeof fluxoAtivo !== 'boolean') {
    return res.status(400).json({ erro: 'fluxoAtivo deve ser booleano' });
  }

  try {
    const ref = db.ref('fluxo').push();
    const id = ref.key;

    const novoFluxo = {
      id,
      litrosReal,
      fluxoAtivo,
      timestamp: new Date().toISOString()
    };

    await db.ref(`fluxo/${id}`).set(novoFluxo);
    ultimoFluxo = novoFluxo;

    // 🔹 Atualiza acumulado do dia
    const hoje = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    const totalRef = db.ref(`totais/${hoje}`);

    await totalRef.transaction((valorAtual) => {
      return (valorAtual || 0) + litrosReal;
    });

    res.status(200).json(novoFluxo);
  } catch (erro) {
    console.error('❌ Erro ao salvar em /fluxo:', erro);
    res.status(500).send('Erro ao salvar fluxo no Firebase.');
  }
});

// ✅ GET: último fluxo
router.get('/', (req, res) => {
  if (ultimoFluxo.litrosReal !== undefined) {
    res.json(ultimoFluxo);
  } else {
    res.status(404).json({ erro: 'Nenhum fluxo disponível ainda.' });
  }
});

// ✅ GET: total do dia (lê acumulado direto)
router.get('/total-dia', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const snapshot = await db.ref(`totais/${hoje}`).once('value');
    const total = snapshot.val() || 0;

    res.json({ totalHoje: total.toFixed(2) });
  } catch (erro) {
    console.error('❌ Erro ao consultar total-dia:', erro);
    res.status(500).json({ erro: 'Erro ao consultar total-dia' });
  }
});

module.exports = router;