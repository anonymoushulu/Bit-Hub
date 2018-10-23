import {candles1m, candles15m, candles1h, candles1D, candles7D} from '../models/candles.model';

const channels = ['bitfinex:1m:BTCUSD', 'bitfinex:15m:BTCUSD', 'bitfinex:1h:BTCUSD', 'bitfinex:1D:BTCUSD', 'bitfinex:7D:BTCUSD',
                  'hitbtc:1m:BTCUSD', 'hitbtc:15m:BTCUSD', 'hitbtc:1h:BTCUSD', 'hitbtc:1D:BTCUSD', 'hitbtc:7D:BTCUSD']

module.exports = function (io) {
  const candles = io.of('/candles')

  candles.on('connection', socket => {

    socket.on('channel', channel => {

      let exchange = '';
      let market = '';
      let interval = '';
      let intervalId = null;
      
      if (channels.indexOf(channel) > -1) {

        socket.join(channel, () => {
          let key = channel.split(':')
          
          exchange = key[0]
          interval = key[1]
          market = key[2]

          getCandles(exchange, market, interval, true)
            .then(data => {
              socket.emit(channel, data)
            })

          if (!intervalId) {
            intervalId = setInterval(function () {
              getCandles(exchange, market, interval, false)
                .then(data => {
                  candles.in(channel).emit(channel, data)
                })
            }, 1000)
          }
          
          socket.on('historical', params => {
            getCandles(exchange, market, interval, false, params.timestamp, params.pointsToDownload)
              .then(data => {
                socket.emit(params.timestamp + '#' + params.pointsToDownload, data)
              })
          })
          
          socket.on('leave', channel => {
            clearInterval(intervalId);
            socket.leave(channel)
            socket.removeAllListeners('historical');
            socket.removeAllListeners('leave');
            socket.removeAllListeners('disconnect');
          });
          
        })

        socket.on('disconnect', () => {
          clearInterval(intervalId);
          socket.disconnect();
        });
      }
    });

  })

  function getCandles(exchange, market, interval, initial, timestamp, pointsToDownload) {
    return new Promise((resolve, reject) => {

      let candleCollection;
      let limit;

      if (initial) {
        limit = 300
      } else {
        limit = 3
      }

      switch (interval) {
        case '1m':
          candleCollection = candles1m
          break;
        case '15m':
          candleCollection = candles15m
          break;
        case '1h':
          candleCollection = candles1h
          break;
        case '1D':
          candleCollection = candles1D
          break;
        case '7D':
          candleCollection = candles7D
          break;
      }

      if (timestamp) {
        //console.log(candleCollection.collection.collectionName)
        candleCollection
          .aggregate([
            {$match: {exchange: exchange, market: market, timestamp: {$lte: timestamp}}},
            {$sort: {timestamp: -1}},
            {$limit: pointsToDownload},
            {$sort: {timestamp: 1}}
          ])
          .then(results => {
            //console.log(results.length)
            if (results.length) {
              resolve(results)
            }
          })
          .catch(err => {
            //console.log(err)
            reject(err)
          })
      } else {
        candleCollection
          .aggregate([
            {$match: {exchange: exchange, market: market}},
            {$sort: {timestamp: -1}},
            {$limit: limit},
            {$sort: {timestamp: 1}}
          ])
          .then(results => {
            //console.log(result.length)
            if (results.length) {
              resolve(results)
            }
          })
          .catch(err => {
            //console.log(err)
            reject(err)
          })
      }
    })
  }

};