import { books } from '../models/books.model';

const dataPointsLimit = 100;

module.exports = function (io) {
  const booksNamespace = io.of('/books')

  booksNamespace.on('connection', socket => {

    socket.on('channel', channel => {

      let exchange = '';
      let market = '';
      let side = '';
      let sort = '';
      let refreshTime = '';
      let intervalId = null;

      socket.join(channel, () => {
        let key = channel.split(':')
        exchange = key[0];
        market = key[1];
        side = key[2];
        sort = key[3]; // String
        refreshTime = parseInt(key[4]);

        getBooks(exchange, market, side, sort)
          .then(data => {
          booksNamespace.in(channel).emit(channel, data)
        })

        if (!intervalId) {
          intervalId = setInterval(() => {
            getBooks(exchange, market, side, sort)
              .then(data => {
                booksNamespace.in(channel).emit(channel, data)
              })
          }, refreshTime * 1000)
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

    })
  });

  const getBooks = (exchange, market, side, sort) => {
    if (side === 'bid' && sort === '1') { // in Ascending order
      return new Promise((resolve, reject) => {
        books
          .aggregate([
            { $match: { exchange: exchange, market: market, amount: { $gt: 0 } } },
            { $sort: { price: -1 } },
            { $limit: dataPointsLimit },
            { $sort: { price: 1} } 
          ])
          .then(results => {
            if (results.length) {
              resolve(results);
            }
          })
          .catch(err => {
            reject(err);
          })
      })
    } else if (side === 'bid' && sort === '-1') { // in Descending order
      return new Promise((resolve, reject) => {
        books
          .aggregate([
            { $match: { exchange: exchange, market: market, amount: { $gt: 0 } } },
            { $sort: { price: -1 } },
            { $limit: dataPointsLimit }
          ])
          .then(results => {
            if (results.length) {
              resolve(results);
            }
          })
          .catch(err => {
            reject(err);
          })
      })
    } else if (side === 'ask') {
      return new Promise((resolve, reject) => {
        books
          .aggregate([
            { $match: { exchange: exchange, market: market, amount: { $lt: 0 } } },
            { $sort: { price: 1 } },
            { $limit: dataPointsLimit }
          ])
          .then(results => {
            if (results.length) {
              resolve(results);
            }
          })
          .catch(err => {
            reject(err);
          })
      })
    }
  }
}