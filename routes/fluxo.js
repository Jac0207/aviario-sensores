const express = require('express');
const router = express.Router();
const RegistroFluxo = require('../models/registroFluxo');

// POST: salvar registro
router.post('/', async (req, res) => {
  try {
    const { litrosPorMinuto, sensorOnline } = req.body;
    const registro = new RegistroFluxo({ litrosPorMinuto, sensorOnline });
    await registro.save();
    res.status(201).json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET: listar registros
router.get('/', async (req, res) => {
  try {
    const registros = await RegistroFluxo.find().sort({ timestamp: -1 }).limit(100);
    res.json(registros);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// GET: total por dia
router.get('/total-dia', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const registros = await RegistroFluxo.find({
      timestamp: { $gte: hoje, $lt: amanha },
    });

    const total = registros.reduce((soma, r) => soma + r.litrosPorMinuto, 0);
    res.json({ totalHoje: total.toFixed(2) });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;