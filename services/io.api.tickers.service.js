import {stats} from '../models/tickers.model';

const channels = ['bitfinex:BTCUSD','hitbtc:BTCUSD', 'coinmarketcap:BTCUSD']

module.exports = function (io) {
  const ticker = io.of('/ticker')

  ticker.on('connection', socket => {

    socket.on('channel', channel => {
      let exchange = '';
      let market = '';
      let intervalId = null;
      
      if (channels.indexOf(channel) > -1) {

        socket.join(channel, () => {
          let key = channel.split(':')

          exchange = key[0]
          market = key[1]

          if (!intervalId) {
            intervalId = setInterval(function () {
              getTicker(exchange, market)
                .then(data => {
                  ticker.in(channel).emit(channel, data)
                })
            }, 1000)
          }
        })

        socket.on('leave', channel => {
          clearInterval(intervalId);
          socket.leave(channel)
          socket.removeAllListeners('leave');
          socket.removeAllListeners('disconnect');
        });

        socket.on('disconnect', () => {
          clearInterval(intervalId);
          socket.disconnect();
        });
      }
    })
  })

  function getTicker(exchange, market) {
    return new Promise((resolve, reject) => {

      stats.find({exchange: exchange, market: market}, {_id: 0})
        .then(result => {
          //console.log(result.length)
          if (result.length) {
            resolve(result)
          }
        })
        .catch(err => {
          //console.log(err)
          reject(err)
        })
    })
  }
};