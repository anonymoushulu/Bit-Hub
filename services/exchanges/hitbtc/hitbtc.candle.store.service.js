import {candles1m, candles15m, candles1h, candles1D, candles7D} from '../../../models/candles.model';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import request from 'es6-request';
import async from 'async';
import Listr from 'listr';

const restEndpoint = 'https://api.hitbtc.com/api/2/public/candles/'
const wsEndpoint = 'wss://api.hitbtc.com/api/2/ws'
const exchange = 'hitbtc'

const ONE_MINUTE = 60
const FIFTEEN_MINUTES = 900
const ONE_HOUR = 3600
const ONE_DAY = 86400
const SEVEN_DAYS = 604800

const ONE_MINUTE_KEY = 'M1'
const FIFTEEN_MINUTES_KEY = 'M15'
const ONE_HOUR_KEY = 'H1'
const ONE_DAY_KEY = 'D1'
const SEVEN_DAYS_KEY = 'D7'

const HISTORICAL_DATA_DOWNLOAD_MESSAGE = 'Downloading Historical Data...(this may take a while)'
const REALTIME_DATA_START_MESSAGE = 'Starting Realtime Storage Service...'
const DATA_INTEGRITY_START_MESSAGE = 'Starting Data Integrity Service...'

const DEFAULT_ERROR_MESSAGE = 'HitBTC Candle Store Service: An error occurred'

const DEFAULT_MAX_RETRIES = 10
const DEFAULT_RETRY_TIME = 2000


module.exports = function (market) {

  function wsService(candleCollection, key) {

    return new Promise((resolve, reject) => {
      
      const options = {
        WebSocket: WS,
        connectionTimeout: 5000
      };

      const rws = new ReconnectingWebSocket(wsEndpoint, [], options);

      let msg = {
        "method": "subscribeCandles",
        "params": {
          "symbol": market,
          "period": key
        },
      }

      rws.addEventListener('open', function () {
        rws.send(JSON.stringify(msg))
        resolve('')
      });
      
      rws.addEventListener('message', event => {

        const data = JSON.parse(event.data)

        if (data.method === 'updateCandles') {
          
          if (Object.keys(data.params.data[0]).length === 7) {
            
            let newCandle = [];
            newCandle.push(retry(processData, [candleCollection, 'ws', data.params.data[0]], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES))

            Promise.all(newCandle)
              .then(candle => {
                return candle.filter(candle => {
                  return typeof candle !== 'undefined';
                });
              })
              .then(candle => {
                retry(bulkInsert, [candleCollection, candle], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
              })
              .catch(err => {
                reject(err)
              })
          }
        }
      });
    })
  }

  function restService(candleCollection, key, candleSize) {
    return new Promise((resolve, reject) => {

      let startDate = 1483228800000
      const endDate = (new Date).getTime()

      async.whilst(
        () => {
          //console.log(startDate)
          //console.log(endDate)
          return startDate + candleSize * 1000 <= endDate;
        },
        (next) => {

          getLatestTimestamp(candleCollection).then(timestamp => {

            if (timestamp) {
              startDate = timestamp
            }

            const paramDate = new Date(startDate).toISOString();
            const url = restEndpoint + key + '&from=' + paramDate + '&sort=ASC' + '&limit=1000'

            setTimeout(() => {
              retry(getRestCandles, url, DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
                .then(results => {
                  //console.log(results.length)
                  let newCandles = [];
                  results.forEach(result => {
                    newCandles.push(
                      retry(processData, [candleCollection, 'rest', result], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
                    )
                  })
                  Promise.all(newCandles)
                    .then(candles => {
                      return candles.filter(candles => {
                        return typeof candles !== 'undefined';
                      });
                    })
                    .then(candles => {
                      retry(bulkInsert, [candleCollection, candles], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES)
                        .then(() => {
                          next()
                        })
                    })
                    .catch(err => {
                      reject(err)
                    })
                })
                .catch(err => {
                  reject(err)
                })
            })
          }, 500)
        }, () => {
          resolve('')
        }
      )
    })
  }

  function processData([candleCollection, type, data]) {
    return new Promise((resolve, reject) => {

      const timestamp = Date.parse(data.timestamp);
      
      candleCollection.find({
        exchange: exchange,
        market: market,
        timestamp: timestamp
      })
        .then(result => {
          //console.log(result)
            if (!result.length) {
              const dataPoint = {
                exchange: exchange,
                market: market,
                timestamp: timestamp,
                open: data.open,
                close: data.close,
                high: data.max,
                low: data.min,
                volume: data.volume,
                type: type
              }

              resolve(dataPoint)

            } else {
              candleCollection.where({exchange: exchange, market: market}).updateOne(
                {timestamp: timestamp},
                {
                  $set: {
                    open: data.open,
                    close: data.close,
                    high: data.max,
                    low: data.min,
                    volume: data.volume,
                    type: type
                  }
                })
                .then(() => {
                  resolve()
                })
                .catch(err => {
                  reject(err)
                })
            }
          }
        )
        .catch(err => {
          reject(err)
        })
    })
  }

  function getRestCandles(url) {
    //console.log(url)
    return new Promise((resolve, reject) => {
      request.get(url)
        .then(([body, res]) => {
          if (res.statusCode === 200) {
            //console.log(body)
            resolve(JSON.parse(body));
          } else {
            reject(new Error('Cannot Connect to HitBTC API'));
          }
        })
        .catch(() => {
          reject(new Error('Cannot Connect to HitBTC API'));
        })
    });
  }

  function getLatestTimestamp(candleDataPoints) {
    return new Promise((resolve, reject) => {
      candleDataPoints.findOne({
        exchange: exchange,
        market: market,
        type: 'rest'
      }, {}, {sort: {timestamp: -1}}, (err, result) => {
        if (err) {
          reject(err)
        } else {
          if (result) {
            resolve(result.timestamp)
          } else {
            resolve()
          }
        }
      })
    })
  }

  function bulkInsert([candleDataPoints, candles]) {
    //console.log(candles[0])
    //console.log(candles[candles.length - 1])
    //console.log(candles.length)
    return new Promise((resolve, reject) => {
      candleDataPoints.insertMany(candles)
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
    });
  }

  function cron(interval, candleCollection, key, gap) {
    return new Promise((resolve, reject) => {
      setInterval(function () {
        restService(candleCollection, key, gap)
          .catch(err => {
            reject(err)
          })
      }, interval*3600000);
      resolve('')
    })
  }

  return {
    start: function () {

      const candles1mKey = market + '?' + 'period=' + ONE_MINUTE_KEY
      const candles15mKey = market + '?' + 'period=' + FIFTEEN_MINUTES_KEY
      const candles1hKey = market + '?' + 'period=' + ONE_HOUR_KEY
      const candles1DKey = market + '?' + 'period=' + ONE_DAY_KEY
      const candles7DKey = market + '?' + 'period=' + SEVEN_DAYS_KEY

      const tasks = new Listr([
        {
          title: 'Starting HitBTC Candle Chart Storage Service For ' + market + ' - 1m...',
          task: () => {
            return new Listr([
              {
                title: HISTORICAL_DATA_DOWNLOAD_MESSAGE,
                task: () => restService(candles1m, candles1mKey, ONE_MINUTE).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: REALTIME_DATA_START_MESSAGE,
                task: () => wsService(candles1m, ONE_MINUTE_KEY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: DATA_INTEGRITY_START_MESSAGE,
                task: () => cron(1, candles1m, candles1mKey, ONE_MINUTE).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              }
            ], {concurrent: false});
          }
        },
        {
          title: 'Starting HitBTC Candle Candle Chart Storage Service For ' + market + ' - 15m...',
          task: () => {
            return new Listr([
              {
                title: HISTORICAL_DATA_DOWNLOAD_MESSAGE,
                task: () => restService(candles15m, candles15mKey, FIFTEEN_MINUTES).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: REALTIME_DATA_START_MESSAGE,
                task: () => wsService(candles15m, FIFTEEN_MINUTES_KEY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: DATA_INTEGRITY_START_MESSAGE,
                task: () => cron(1, candles15m, candles15mKey, FIFTEEN_MINUTES).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              }
            ], {concurrent: false});
          }
        },
        {
          title: 'Starting HitBTC Candle Candle Chart Storage Service For ' + market + ' - 1h...',
          task: () => {
            return new Listr([
              {
                title: HISTORICAL_DATA_DOWNLOAD_MESSAGE,
                task: () => restService(candles1h, candles1hKey, ONE_HOUR).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: REALTIME_DATA_START_MESSAGE,
                task: () => wsService(candles1h, ONE_HOUR_KEY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: DATA_INTEGRITY_START_MESSAGE,
                task: () => cron(2, candles1h, candles1hKey, ONE_HOUR).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              }
            ], {concurrent: false});
          }
        },
        {
          title: 'Starting HitBTC Candle Chart Storage Service For ' + market + ' - 1D...',
          task: () => {
            return new Listr([
              {
                title: HISTORICAL_DATA_DOWNLOAD_MESSAGE,
                task: () => restService(candles1D, candles1DKey, ONE_DAY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: REALTIME_DATA_START_MESSAGE,
                task: () => wsService(candles1D, ONE_DAY_KEY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: DATA_INTEGRITY_START_MESSAGE,
                task: () => cron(24, candles1D, candles1DKey, ONE_DAY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              }
            ], {concurrent: false});
          }
        },
        {
          title: 'Starting HitBTC Candle Chart Storage Service For ' + market + ' - 7D...',
          task: () => {
            return new Listr([
              {
                title: HISTORICAL_DATA_DOWNLOAD_MESSAGE,
                task: () => restService(candles7D, candles7DKey, SEVEN_DAYS).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: REALTIME_DATA_START_MESSAGE,
                task: () => wsService(candles7D, SEVEN_DAYS_KEY).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: DATA_INTEGRITY_START_MESSAGE,
                task: () => cron(24, candles7D, candles7DKey, SEVEN_DAYS).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              }
            ], {concurrent: false});
          }
        },
      ], {concurrent: true});

      tasks.run()
        .then(() => {
          console.log('=> done!')
        })
        .catch(err => {
          console.log(err + '\nError: Exiting...')
          process.exit(1)
        });
      
    },
  };
}