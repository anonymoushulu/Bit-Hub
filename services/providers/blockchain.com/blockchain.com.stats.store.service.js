import {stats} from '../../../models/stats.model';
import request from 'es6-request';
import Listr from "listr";
import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from "ws";

const restEndpoint = 'https://api.blockchain.info/stats'
const wsEndpoint = 'wss://ws.blockchain.info/inv'
const provider = 'blockchaindotcom'

const DEFAULT_ERROR_MESSAGE = 'Blockchain.com Stats Store Service: An error occurred'

module.exports = function () {

  function wsService() {

    return new Promise((resolve) => {

      const options = {
        WebSocket: WS,
        connectionTimeout: 5000
      };

      const rws = new ReconnectingWebSocket(wsEndpoint, [], options);

      let msg = {op: 'blocks_sub'}

      rws.addEventListener('open', function () {
        rws.send(JSON.stringify(msg))
        resolve('')
      });

      rws.addEventListener('message', event => {

        const data = JSON.parse(event.data)

        if (data.op === 'block') {
          if (Object.keys(data.x).length === 17) {
            stats.where({provider: provider, symbol: 'BTC'}).updateOne(
              {
                $set: {
                  block: {
                    height: data.x.height,
                    foundBy: {
                      description: data.x.foundBy.description,
                      link: 'https://www.blockchain.com/btc/block-index/' + data.x.blockIndex
                    }
                  }
                }
              })
              .catch(err => {
                console.log(err)
              })
          }
        }
      });
    })
  }

  function restService() {
    return new Promise(resolve => {
      setInterval(function () {
        getStats(restEndpoint)
          .then(result => {
            processData(result)
            resolve()
          })
      }, 60000)
      resolve('')
    })
  }

  function processData(data) {

    stats.find({
      provider: provider,
      symbol: 'BTC'
    })
      .then(result => {
          if (!result.length) {

            const newTicker = {
              provider: provider,
              symbol: 'BTC',
              block: {
                height: data['n_blocks_total'],
                foundBy: {
                  description: 'N/A',
                  link: '/home/#'
                }
              },
              blocksMined: data['n_blocks_mined'],
              btcMined: data['n_btc_mined'] / 100000000,
              minutesBetweenBlocks: data['minutes_between_blocks'],
              difficulty: data['difficulty'],
              hashRate: data['hash_rate'],
              totalBtc: data['totalbc'] / 100000000,
              totalFeesBtc: data['total_fees_btc'] / 100000000,
              transactions: data['n_tx'],
              totalBtcSent: data['total_btc_sent'] / 100000000,
              estimatedBtcSent: data['estimated_btc_sent'] / 100000000,
              estimatedUsdSent: data['estimated_btc_sent'] / 100000000 * data['market_price_usd'],
              minerRevenueUsd: data['miners_revenue_usd'],
              minerRevenueBtc: data['miners_revenue_btc'],
              tradeVolumeUsd: data['trade_volume_usd'],
              tradeVolumeBtc: data['trade_volume_btc'],
            }

            stats.create(newTicker)
              .catch(err => {
                if (err.code && err.code !== 11000) {
                  console.log(err)
                }
              })

          } else {
            stats.where({provider: provider, symbol: 'BTC'}).updateOne(
              {
                $set: {
                  blocksMined: data['n_blocks_mined'],
                  btcMined: data['n_btc_mined'] / 100000000,
                  minutesBetweenBlocks: data['minutes_between_blocks'],
                  difficulty: data['difficulty'],
                  hashRate: data['hash_rate'],
                  totalBtc: data['totalbc'] / 100000000,
                  totalFeesBtc: data['total_fees_btc'] / 100000000,
                  transactions: data['n_tx'],
                  totalBtcSent: data['total_btc_sent'] / 100000000,
                  estimatedBtcSent: data['estimated_btc_sent'] / 100000000,
                  estimatedUsdSent: data['estimated_btc_sent'] / 100000000 * data['market_price_usd'],
                  minerRevenueUsd: data['miners_revenue_usd'],
                  minerRevenueBtc: data['miners_revenue_btc'],
                  tradeVolumeUsd: data['trade_volume_usd'],
                  tradeVolumeBtc: data['trade_volume_btc']
                }
              })
              .catch(err => {
                console.log(err)
              })
          }
        }
      )
  }

  function getStats(url) {
    //console.log(url)
    return new Promise((resolve, reject) => {
      request.get(url)
        .then(([body, res]) => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error('Cannot Connect to Blockchain.com API'));
          }
        })
        .catch(() => {
          //reject(new Error('Cannot Connect to Blockchain.com API'));
        })
    });
  }

  return {
    start: function () {

      const tasks = new Listr([
        {
          title: 'Starting Blockchain.com Rest Stats Storage Service...',
          task: () => restService().then(result => {
            if (result !== '') {
              throw new Error(DEFAULT_ERROR_MESSAGE);
            }
          })
        },
        {
          title: 'Starting Blockchain.com WS Stats Storage Service...',
          task: () => wsService().then(result => {
            if (result !== '') {
              throw new Error(DEFAULT_ERROR_MESSAGE);
            }
          })
        }
      ], {collapse: false});

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