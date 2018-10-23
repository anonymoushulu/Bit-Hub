import {candles1m, candles15m, candles1h, candles1D, candles7D} from '../../../models/candles.model';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import request from 'es6-request';
import async from 'async';
import Listr from 'listr';

const restEndpoint = 'https://api.bitfinex.com/v2/candles/'
const wsEndpoint = 'wss://api.bitfinex.com/ws/2'
const exchange = 'bitfinex'

const ONE_MINUTE = 60
const FIFTEEN_MINUTES = 900
const ONE_HOUR = 3600
const ONE_DAY = 86400
const SEVEN_DAYS = 604800

const ONE_MINUTE_KEY = 'trade:1m:t'
const FIFTEEN_MINUTES_KEY = 'trade:15m:t'
const ONE_HOUR_KEY = 'trade:1h:t'
const ONE_DAY_KEY = 'trade:1D:t'
const SEVEN_DAYS_KEY = 'trade:7D:t'

const HISTORICAL_DATA_DOWNLOAD_MESSAGE = 'Downloading Historical Data...(this may take a while)'
const REALTIME_DATA_START_MESSAGE = 'Starting Realtime Storage Service...'
const DATA_INTEGRITY_START_MESSAGE = 'Starting Data Integrity Service...'

const DEFAULT_ERROR_MESSAGE = 'Bitfinex Candle Store Service: An error occurred'

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
        event: 'subscribe',
        channel: 'candles',
        key: key
      }

      rws.addEventListener('open', function () {
        rws.send(JSON.stringify(msg))
        resolve('')
      });
      
      rws.addEventListener('message', event => {

        const data = strToArr(event.data)

        if (data.length === 6) {
          let newCandle = [];
   
          newCandle.push(retry(processData, [candleCollection, 'ws', data], DEFAULT_RETRY_TIME, DEFAULT_MAX_RETRIES))

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

            const url = restEndpoint + key + '/hist?start=' + startDate + '&sort=1' + '&limit=1000'

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
          }, 1800)
        }, () => {
          resolve('')
        }
      )
    })
  }

  function processData([candleCollection, type, data]) {
    return new Promise((resolve, reject) => {
      let point = {};
      [point.timestamp, point.open, point.high, point.low, point.close, point.volume] = [data[0], data[1], data[3], data[4], data[2], data[5]];

      candleCollection.find({
        exchange: exchange,
        market: market,
        timestamp: point.timestamp
      })
        .then(result => {
            if (!result.length) {
              const dataPoint = {
                exchange: exchange,
                market: market,
                timestamp: point.timestamp,
                open: point.open,
                close: point.close,
                high: point.high,
                low: point.low,
                volume: point.volume,
                type: type
              }

              resolve(dataPoint)

            } else {
              candleCollection.where({exchange: exchange, market: market}).updateOne(
                {timestamp: point.timestamp},
                {
                  $set: {
                    open: point.open,
                    close: point.close,
                    high: point.high,
                    low: point.low,
                    volume: point.volume,
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
            resolve(JSON.parse(body));
          } else {
            reject(new Error('Cannot Connect to Bitfinex API'));
          }
        })
        .catch(() => {
          reject(new Error('Cannot Connect to Bitfinex API'));
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

  function strToArr(str) {
    str = str.replace(/\[/g, '').replace(/\]/g, '').split(',');
    str.shift();
    for (let i = 0; i < str.length; i++) {
      str[i] = parseFloat(str[i])
    }
    return str;
  }

  return {
    start: function () {

      const candles1mKey = ONE_MINUTE_KEY + market
      const candles15mKey = FIFTEEN_MINUTES_KEY + market
      const candles1hKey = ONE_HOUR_KEY + market
      const candles1DKey = ONE_DAY_KEY + market
      const candles7DKey = SEVEN_DAYS_KEY + market

      const tasks = new Listr([
        {
          title: 'Starting Bitfinex Candle Chart Storage Service For ' + market + ' - 1m...',
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
                task: () => wsService(candles1m, candles1mKey).then(result => {
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
          title: 'Starting Bitfinex Candle Candle Chart Storage Service For ' + market + ' - 15m...',
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
                task: () => wsService(candles15m, candles15mKey).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              },
              {
                title: DATA_INTEGRITY_START_MESSAGE,
                task: () => cron(2, candles15m, candles15mKey, FIFTEEN_MINUTES).then(result => {
                  if (result !== '') {
                    throw new Error(DEFAULT_ERROR_MESSAGE);
                  }
                })
              }
            ], {concurrent: false});
          }
        },
        {
          title: 'Starting Bitfinex Candle Candle Chart Storage Service For ' + market + ' - 1h...',
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
                task: () => wsService(candles1h, candles1hKey).then(result => {
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
          title: 'Starting Bitfinex Candle Chart Storage Service For ' + market + ' - 1D...',
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
                task: () => wsService(candles1D, candles1DKey).then(result => {
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
          title: 'Starting Bitfinex Candle Chart Storage Service For ' + market + ' - 7D...',
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
                task: () => wsService(candles7D, candles7DKey).then(result => {
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