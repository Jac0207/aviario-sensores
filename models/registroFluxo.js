const mongoose = require('mongoose');

const registroFluxoSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  litrosPorMinuto: Number,
  sensorOnline: Boolean,
});

module.exports = mongoose.model('RegistroFluxo', registroFluxoSchema);