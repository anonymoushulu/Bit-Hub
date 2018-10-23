import mongoose from 'mongoose';

const statsSchema = new mongoose.Schema({
  provider: String,
  symbol: String,
  block: Object,
  blocksMined: Number,
  btcMined: Number,
  minutesBetweenBlocks: Number,
  difficulty: Number,
  hashRate: Number,
  totalBtc: Number,
  totalFeesBtc: Number,
  transactions: Number,
  totalBtcSent: Number,
  estimatedBtcSent: Number,
  estimatedUsdSent: Number,
  minerRevenueUsd: Number,
  minerRevenueBtc: Number,
  tradeVolumeUsd: Number,
  tradeVolumeBtc: Number,
  test: String
});

statsSchema.index({ provider: 1, symbol: 1 }, { unique: true })

const stats = mongoose.model('stats', statsSchema);

module.exports = { stats };

