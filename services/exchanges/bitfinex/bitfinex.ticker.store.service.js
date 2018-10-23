import {stats} from '../../../models/tickers.model';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import Listr from 'listr';

const wsEndpoint = 'wss://api.bitfinex.com/ws/2'
const exchange = 'bitfinex'

const DEFAULT_ERROR_MESSAGE = 'Bitfinex RealTime Ticker Storage Service: An error occurred'


module.exports = function (market) {

  function wsService(market) {

    return new Promise((resolve) => {
      const options = {
        WebSocket: WS,
        connectionTimeout: 5000
      };

      const rws = new ReconnectingWebSocket(wsEndpoint, [], options);

      let msg = {
        event: 'subscribe',
        channel: 'ticker',
        symbol: 't' + market
      }

      rws.addEventListener('open', function () {
        rws.send(JSON.stringify(msg))
        resolve('')
      });

      rws.addEventListener('message', event => {

        let data = strToArr(event.data)

        if (data.length === 10) {
          processData(data)
        }

      });
    })
  }


  function processData(data) {
    let ticker = {};
    [ticker.dailyChange, ticker.dailyChangePerc, ticker.lastPrice, ticker.volume, ticker.high, ticker.low] = [data[4], data[5], data[6], data[7], data[8], data[9]];

    stats.find({
      exchange: exchange,
      market: market
    })
      .then(result => {
          if (!result.length) {
            const newTicker = {
              exchange: exchange,
              market: market,
              dailyChange: ticker.dailyChange,
              dailyChangePerc: Math.abs((ticker.low - ticker.lastPrice) / ticker.lastPrice * 100),
              lastPrice: ticker.lastPrice,
              high: ticker.high,
              low: ticker.low,
              volume: ticker.volume
            }

            stats.create(newTicker)
              .catch(err => {
                if (err.code && err.code !== 11000) {
                  console.log(err)
                }
              })

          } else {
            stats.where({exchange: exchange, market: market}).updateOne(
              {
                $set: {
                  dailyChange: ticker.dailyChange,
                  dailyChangePerc: Math.abs((ticker.low - ticker.lastPrice) / ticker.lastPrice * 100),
                  lastPrice: ticker.lastPrice,
                  high: ticker.high,
                  low: ticker.low,
                  volume: ticker.volume
                }
              })
              .catch(err => {
                console.log(err)
              })
          }
        }
      )
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

      const tasks = new Listr([
        {
          title: 'Starting Bitfinex RealTime Ticker Storage Service...',
          task: () => wsService(market).then(result => {
            if (result !== '') {
              throw new Error(DEFAULT_ERROR_MESSAGE);
            }
          })
        }], {collapse: false});

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