import mongoose from 'mongoose';

const candlesSchema = new mongoose.Schema({
  exchange: String,
  market: String,
  timestamp: Number,
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number,
  type: String
});

candlesSchema.index({ timestamp: -1});
candlesSchema.index({ timestamp: 1});
candlesSchema.index({ exchange: 1, market: 1, timestamp: 1 }, { unique: true })

const candles1m = mongoose.model('candles1mDataPoints', candlesSchema);
const candles15m = mongoose.model('candles15mDataPoints', candlesSchema);
const candles1h = mongoose.model('candles1hDataPoints', candlesSchema);
const candles1D = mongoose.model('candles1DDataPoints', candlesSchema);
const candles7D = mongoose.model('candles7DDataPoints', candlesSchema);

module.exports = {candles1m, candles15m, candles1h, candles1D, candles7D};

