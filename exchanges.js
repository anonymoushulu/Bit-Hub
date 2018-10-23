const exchanges = {};

// Bitfinex

bitfinex = exchanges.bitfinex = {}

// BTC/USD
bitfinex.name = 'Bitfinex'

bitfinex.markets = {}

bitfinex.markets.btcusd = {}
bitfinex.markets.btcusd.name = 'BTC/USD'
bitfinex.markets.btcusd.channels = ['bitfinex:1m:BTCUSD', 'bitfinex:15m:BTCUSD', 'bitfinex:1h:BTCUSD', 'bitfinex:1D:BTCUSD', 'bitfinex:7D:BTCUSD']
bitfinex.markets.btcusd.ticker = 'bitfinex:BTCUSD'


// Bitfinex

hitbtc = exchanges.hitbtc = {}

// BTC/USD
hitbtc.name= 'HitBTC'

hitbtc.markets = {}

hitbtc.markets.btcusd = {}
hitbtc.markets.btcusd.name = 'BTC/USD'
hitbtc.markets.btcusd.channels = ['hitbtc:1m:BTCUSD', 'hitbtc:15m:BTCUSD', 'hitbtc:1h:BTCUSD', 'hitbtc:1D:BTCUSD', 'hitbtc:7D:BTCUSD']
hitbtc.markets.btcusd.ticker = 'hitbtc:BTCUSD'


module.exports=exchanges;