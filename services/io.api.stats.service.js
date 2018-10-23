import {stats} from '../models/stats.model';

const channels = ['blockchaindotcom:BTC']

module.exports = function (io) {
  const statsNamespace = io.of('/stats')

  statsNamespace.on('connection', socket => {

    let provider = ''
    let symbol = ''

    socket.on('channel', channel => {
      
      let intervalId = null;
      
      if (channels.indexOf(channel) > -1) {

        socket.join(channel, () => {
          let key = channel.split(':')

          provider = key[0]
          symbol = key[1]

          if (!intervalId) {
            intervalId = setInterval(function () {
              getStats(provider, symbol)
                .then(data => {
                  statsNamespace.in(channel).emit(channel, data)
                })
            }, 1000)
          }

          socket.on('leave', channel => {
            clearInterval(intervalId);
            socket.leave(channel)
            socket.removeAllListeners('leave');
            socket.removeAllListeners('disconnect');
          });
        })

        socket.on('disconnect', () => {
          clearInterval(intervalId);
          socket.disconnect();
        });
      }
    })
  })

  function getStats(provider, symbol) {
    return new Promise((resolve, reject) => {

      stats.find({provider: provider, symbol: symbol}, {_id: 0})
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