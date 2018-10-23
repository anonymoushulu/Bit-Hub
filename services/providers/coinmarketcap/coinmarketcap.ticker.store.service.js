import {stats} from '../../../models/tickers.model';
import request from 'es6-request';
import Listr from "listr";

const restEndpoint = 'https://api.coinmarketcap.com/v2/ticker/1/'
const exchange = 'coinmarketcap'

const DEFAULT_ERROR_MESSAGE = 'Coinmarketcap Ticker Store Service: An error occurred'

module.exports = function () {


  function restService() {
    return new Promise(resolve => {
      setInterval(function () {
        getTicker(restEndpoint)
          .then(result => {
            processData(result.data)
            resolve()
          })
      }, 5000)
      resolve('')
    })
  }

  function processData(data) {

    stats.find({
      exchange: exchange,
      market: 'BTCUSD'
    })
      .then(result => {
          if (!result.length) {
            const newTicker = {
              exchange: exchange,
              market: 'BTCUSD',
              price: data['quotes']['USD']['price'],
              circulatingSupply: data['circulating_supply'],
              totalSupply: data['total_supply'],
              maxSupply: data['max_supply'],
              dailyChangePerc: data['quotes']['USD']['percent_change_24h'],
              volume: data['quotes']['USD']['volume_24h'],
              marketCap: data['circulating_supply'] * data['quotes']['USD']['price']
            }

            stats.create(newTicker)
              .catch(err => {
                if (err.code && err.code !== 11000) {
                  console.log(err)
                }
              })

          } else {
            stats.where({exchange: exchange, market: 'BTCUSD'}).updateOne(
              {
                $set: {
                  price: data['quotes']['USD']['price'],
                  circulatingSupply: data['circulating_supply'],
                  totalSupply: data['total_supply'],
                  maxSupply: data['max_supply'],
                  dailyChangePerc: data['quotes']['USD']['percent_change_24h'],
                  volume: data['quotes']['USD']['volume_24h'],
                  marketCap: data['circulating_supply'] * data['quotes']['USD']['price']
                }
              })
              .catch(err => {
                console.log(err)
              })
          }
        }
      )
  }

  function getTicker(url) {
    //console.log(url)
    return new Promise((resolve, reject) => {
      request.get(url)
        .then(([body, res]) => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error('Cannot Connect to Coinmarketcap API'));
          }
        })
        .catch(() => {
          //reject(new Error('Cannot Connect to Coinmarketcap API'));
        })
    });
  }

  return {
    start: function () {

      const tasks = new Listr([
        {
          title: 'Starting Coinmarketcap Ticker Storage Service...',
          task: () => restService().then(result => {
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