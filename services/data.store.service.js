import bitfinexCandles from '../services/exchanges/bitfinex/bitfinex.candle.store.service'
import bitfinexTicker from '../services/exchanges/bitfinex/bitfinex.ticker.store.service'
import bitfinexOrderBook from '../services/exchanges/bitfinex/bitfinex.orderbook.store.service'

import hitbtcCandles from '../services/exchanges/hitbtc/hitbtc.candle.store.service'
import hitbtcTicker from '../services/exchanges/hitbtc/hitbtc.ticker.store.service'
import hitbtcOrderBook from '../services/exchanges/hitbtc/hitbtc.orderbook.store.service'

import coinmarketcapTicker from '../services/providers/coinmarketcap/coinmarketcap.ticker.store.service'

import blockchaindotcomStats from '../services/providers/blockchain.com/blockchain.com.stats.store.service'

module.exports = function() {
  
  // Bitfinex Storage Services
  bitfinexCandles('BTCUSD').start();
  bitfinexTicker('BTCUSD').start();
  bitfinexOrderBook('BTCUSD').start();
    
  // HitBTC Data Points Storage Service
  hitbtcCandles('BTCUSD').start();
  hitbtcTicker('BTCUSD').start();
  hitbtcOrderBook('BTCUSD').start();
  
  // Coinmarketcap BTC
  coinmarketcapTicker().start();
  
  // Blockchain.com Stats
  blockchaindotcomStats().start();
  
};