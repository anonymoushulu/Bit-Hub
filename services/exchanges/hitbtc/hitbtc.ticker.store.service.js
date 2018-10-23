import {stats} from '../../../models/tickers.model';
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import Listr from 'listr';

const wsEndpoint = 'wss://api.hitbtc.com/api/2/ws'
const exchange = 'hitbtc'

const DEFAULT_ERROR_MESSAGE = 'HitBTC RealTime Ticker Storage Service: An error occurred'

module.exports = function (market) {

  function wsService(market) {

    return new Promise((resolve) => {

      const options = {
        WebSocket: WS,
        connectionTimeout: 5000
      };

      const rws = new ReconnectingWebSocket(wsEndpoint, [], options);


      let msg = {
        method: 'subscribeTicker',
        params: {
          symbol: market
        }
      }

      rws.addEventListener('open', function () {
        rws.send(JSON.stringify(msg))
        resolve('')
      });

      rws.addEventListener('message', event => {
        
        const data = JSON.parse(event.data)
        
        if (data.method === 'ticker') {
          if (Object.keys(data.params).length === 10) {
            processData(data.params)
          }
        }
      });
    })
  }


  function processData(data) {

    stats.find({
      exchange: exchange,
      market: market
    })
      .then(result => {
          if (!result.length) {

            const newTicker = {
              exchange: exchange,
              market: market,
              dailyChange: Math.abs(data.open - data.last),
              dailyChangePerc: Math.abs((data.open - data.last) / data.last * 100),
              lastPrice: data.last,
              high: data.high,
              low: data.low,
              volume: data.volume
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
                  dailyChange: Math.abs(data.open - data.last),
                  dailyChangePerc: Math.abs((data.open - data.last) / data.last * 100),
                  lastPrice: data.last,
                  high: data.high,
                  low: data.low,
                  volume: data.volume
                }
              })
              .catch(err => {
                console.log(err)
              })
          }
        }
      )
  }

  return {
    start: function () {

      const tasks = new Listr([
        {
          title: 'Starting HitBTC RealTime Ticker Storage Service...',
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