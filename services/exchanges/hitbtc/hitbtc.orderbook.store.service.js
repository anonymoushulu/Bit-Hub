import {books} from '../../../models/books.model';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import Listr from 'listr';

const wsEndpoint = 'wss://api.hitbtc.com/api/2/ws'
const exchange = 'hitbtc'

const ORDERBOOK_DATA_DOWNLOAD_MESSAGE = 'Downloading OrderBook Data...(this may take a while)'
const DEFAULT_ERROR_MESSAGE = 'HitBTC OrderBook Store Service: An error occurred'

const DEFAULT_MAX_RETRIES = 5
const DEFAULT_RETRY_TIME = 2000


module.exports = function (market) {

  function wsService(orderBookCollection, market) {

    return new Promise((resolve, reject) => {

      const options = {
        WebSocket: WS,
        connectionTimeout: 5000
      };

      const rws = new ReconnectingWebSocket(wsEndpoint, [], options);

      let msg = {
        "method": "subscribeOrderbook",
        "params": {
          "symbol": market,
        }
      }

      rws.addEventListener('open', function () {
        rws.send(JSON.stringify(msg))
        resolve('')
      });

      rws.addEventListener('message', event => {

        let newData = JSON.parse(event.data);
        //let point = {}
       
        if (newData.method === "snapshotOrderbook") {
          let OrderBookData = newData.params;
          let bookpsnap = [];
          
          OrderBookData.ask.forEach(res => {
            let point = {};
            [point.exchange, point.market, point.price, point.amount, point.side] = [exchange, market, res.price, (-1 * res.size),'ask']
            bookpsnap.push(point);
            
          });
          OrderBookData.bid.forEach(res => {
            let point = {};
            [point.exchange, point.market, point.price, point.amount, point.side] = [exchange, market, res.price, res.size,'bid'];
            bookpsnap.push(point);
          });          
            
          retry(bulkInsert, [orderBookCollection, bookpsnap], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
        }
        else if (newData.method === "updateOrderbook") {
          let newOrderBooks = [];
          let OrderBookData = newData.params;
          if (OrderBookData.ask.length === 0 || OrderBookData.bid.length === 0) return
 
          newOrderBooks.push(retry(processData, [orderBookCollection, 'ws', OrderBookData], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES))

        }
      });
    })
  }

  function processData([orderBookCollection, type, bookdata]) {
    return new Promise((resolve, reject) => {
        let point = {};
        bookdata.ask.forEach(res => {
            [point.exchange, point.market, point.price, point.amount, point.side] = [exchange, market, res.price,(-1 * res.size), 'ask'];
              //console.log(point)
            if (point.amount === 0) {        
                orderBookCollection
                  .deleteOne({exchange: exchange, market: market, price: point.price, side: point.side})
                  .then(() => {
                    resolve()
                  })
                  .catch(err => {
                    reject(err)
                  })
            }
            else if (point.amount > 0){
                orderBookCollection.find({
                exchange: exchange,
                market: market,
                price: point.price,
                side:point.side
              })
                .then(result => {
                    if (!result.length) {

                      const dataPoint = {
                        exchange: exchange,
                        market: market,
                        price: point.price,
                        amount: point.amount,
                        side:point.side
                      }

                      resolve(dataPoint)
                    } else {
                      orderBookCollection.where({exchange: exchange, market: market, side: point.side}).updateOne(
                        {price: point.price},
                        {
                          $set: {
                            amount: point.amount,
                          }
                        })
                        .catch(err => {
                          console.log(err)
                        })
                    }
                  }
                )
                .catch(err => {
                  reject(err)
                })
                
            }
            
            });
            
        bookdata.bid.forEach(res => {
                [point.exchange, point.market, point.price, point.amount, point.side] = [exchange, market, res.price, res.size, 'bid'];
              //console.log(point)
                if (point.amount === 0) {  
                     orderBookCollection
                      .deleteOne({exchange: exchange, market: market, price: point.price, side: point.side})
                      .then(() => {
                        resolve()
                      })
                      .catch(err => {
                        reject(err)
                      })
                }
                else if (point.amount > 0){
                    orderBookCollection.find({
                    exchange: exchange,
                    market: market,
                    price: point.price,
                    side:point.side
                  })
                    .then(result => {
                        if (!result.length) {

                          const dataPoint = {
                            exchange: exchange,
                            market: market,
                            price: point.price,
                            amount: point.amount,
                            side:point.side
                          }

                          resolve(dataPoint)
                        } else {
                          orderBookCollection.where({exchange: exchange, market: market, side: point.side}).updateOne(
                            {price: point.price},
                            {
                              $set: {
                                amount: point.amount,
                              }
                            })
                            .catch(err => {
                              console.log(err)
                            })
                        }
                      }
                    )
                    .catch(err => {
                      reject(err)
                    })
                }
                
            });
    });
  }

  function bulkInsert([orderBookDataPoints, orderbook]) {
    return new Promise((resolve, reject) => {
      orderBookDataPoints.insertMany(orderbook)
        .then(() => {
          resolve()
        })
        .catch(err => {
          if (err.code && err.code !== 11000) {
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
      .catch(err => {
        console.log('ERROR', err);

      });
  }

  return {
    start: function () {

      const tasks = new Listr([
        {
          title: 'Starting HitBTC RealTime Books Storage Service...',
          task: () =>wsService(books, market).then(result => {
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
    },
    /*
      start: function () {
          wsService(books, market).then(result => {
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