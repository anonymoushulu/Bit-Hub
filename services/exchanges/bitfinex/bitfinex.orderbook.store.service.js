import {books} from '../../../models/books.model';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import Listr from 'listr';
import {stats} from "../../../models/tickers.model";

const wsEndpoint = 'wss://api.bitfinex.com/ws/2'
const exchange = 'bitfinex'

const DEFAULT_ERROR_MESSAGE = 'Bitfinex OrderBook Store Service: An error occurred'

const DEFAULT_MAX_RETRIES = 1
const DEFAULT_RETRY_TIME = 2000


module.exports = function (market) {

  function wsService(orderBookCollection, key) {
    return new Promise((resolve, reject) => {

      const options = {
        WebSocket: WS,
        connectionTimeout: 5000
      };

      const rws = new ReconnectingWebSocket(wsEndpoint, [], options);

      rws.addEventListener('open', function () {

        rws.send(JSON.stringify({event: 'conf', flags: 65536}))

        rws.send(JSON.stringify({
          event: 'subscribe',
          channel: 'book',
          symbol: key,
          prec: "P0",
          freq: "F0",
          len: 100
        }))

        resolve('')
      });

      let sequenceNum = 0;

      rws.addEventListener('message', event => {

        const data = JSON.parse(event.data);

        if (Array.isArray(data[1])) {
          if (data[2] - 1 === sequenceNum) {
            sequenceNum = data[2]
            if (data[2] === 1) {
              const orderbooks = data[1].map(function (x) {
                if (x[2] > 0) {
                  return {
                    exchange: exchange,
                    market: market,
                    price: x[0],
                    amount: x[2],
                    side: 'bid'
                  };
                } else {
                  return {
                    exchange: exchange,
                    market: market,
                    price: x[0],
                    amount: x[2],
                    side: 'ask'
                  };
                }
              });
              retry(bulkInsert, [orderBookCollection, orderbooks], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
                .catch(err => {
                  reject(err)
                });
            } else {
              retry(processData, [orderBookCollection, data[1]], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
                .catch(err => {
                  reject(err)
                });
            }
          } else {
            rws.close()
          }
        }
      })

      rws.addEventListener('close', () => {
        books.deleteMany({exchange: exchange, market: market})
          .then(() => {
            wsService(orderBookCollection, key)
              .catch(err => {
                console.log(err + '\nError: Exiting...')
                process.exit(1)
              });
          })
      })

    })
  }
  
  function processData([orderBookCollection, data]) {
    return new Promise((resolve, reject) => {
      let order = {};
      let side = '';

      [order.price, order.count, order.amount] = [data[0], data[1], data[2]];


      if (order.amount > 0) {
        side = 'bid'
      } else {
        side = 'ask'
      }

      if (order.count === 0) {

        orderBookCollection
          .deleteOne({exchange: exchange, market: market, price: order.price, side: side})
          .then(() => {
            resolve()
          })
          .catch(err => {
            reject(err)
          })
      } else if (order.count > 0) {

        orderBookCollection.find({
          exchange: exchange,
          market: market,
          price: order.price,
          side: side
        })
          .then(result => {
            if (!result.length) {
              const newOrder = {
                exchange: exchange,
                market: market,
                price: order.price,
                amount: order.amount,
                side: side
              }

              orderBookCollection.create(newOrder)
                .then(() => {
                  resolve()
                })
                .catch(err => {
                  if (err.code && err.code !== 11000) {
                    console.log(data)
                    console.log(err)
                  }
                })

            } else {

              orderBookCollection.where({exchange: exchange, market: market, side: side}).updateOne(
                {price: order.price},
                {
                  $set: {
                    amount: order.amount,
                  }
                })
                .then(() => {
                  resolve()
                })
                .catch(err => {
                  reject(err)
                })
            }
          })

      }
    })
  }

  function bulkInsert([orderBookDataPoints, orderbook]) {
    return new Promise((resolve, reject) => {
      orderBookDataPoints.insertMany(orderbook)
        .then(() => {
          resolve()
        })
        .catch(err => {
          if (err.code && err.code !== 11000) {
            //console.log(err);
            reject()
          }
          resolve()
        })
    })
  }

  function retry(fn, args, ms, maxRetries) {
    return new Promise((resolve, reject) => {
      fn(args)
        .then(resolve)
        .catch(err => {
          setTimeout(() => {
            //console.log('retrying...' + ' ' + args);
            if (maxRetries === 0) {
              reject(err);
              return;
            }
            retry(fn, args, Math.min(10000, ms * 2), maxRetries - 1)
              .then(resolve)
              .catch(err => {
                reject(err)
              })
          }, ms);
        })
    })
  }

  return {
    start: function () {

      const key = 't' + market

      const tasks = new Listr([
        {
          title: 'Starting Bitfinex RealTime Books Storage Service...',
          task: () => wsService(books, key).then(result => {
            if (result !== '') {
              throw new Error(DEFAULT_ERROR_MESSAGE);
            }
          })
        }], {collapse: false});

      books.deleteMany({exchange: exchange, market: market})
        .then(() => {
          tasks.run()
            .then(() => {
              console.log('=> done!')
            })
            .catch(err => {
              console.log(err + '\nError: Exiting...')
              process.exit(1)
            });
        })
    }

    /*start: function () {
      wsService(books).then(result => {
        if (result !== '') {
          throw new Error('An error occurred');
        }
        console.log('done!')
      }).catch(err => {
        console.log(err)
      })
    }*/

  };

}