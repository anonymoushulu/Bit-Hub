import mongoose from 'mongoose';

const tickerSchema = new mongoose.Schema({
  exchange: String,
  market: String,
  lastPrice: Number,
  volume: Number,
  high: Number,
  low: Number,
  price: Number,
  dailyChange: Number,
  dailyChangePerc: Number,
  marketCap: Number,
  circulatingSupply: Number,
  totalSupply: Number,
  maxSupply: Number,
});

tickerSchema.index({ exchange: 1, market: 1 }, { unique: true })

const tickers = mongoose.model('tickers', tickerSchema);

module.exports = { stats: tickers };

