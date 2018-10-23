const express = require('express');
const http = require('http');
const app = express();
const mongoose = require('mongoose');

const config = require('./config.js');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const api = require('./routes/api/index.route');
const auth = require('./services/auth.service')();
const ioApiCandlesService = require('./services/io.api.candles.service');
const ioApiBooksService = require('./services/io.api.books.service');
const ioApiTickersService = require('./services/io.api.tickers.service');
const ioApiStatsService = require('./services/io.api.stats.service');

const dataStoreService = require('./services/data.store.service');

// Handles ports already taken
process.on('uncaughtException', function (err) {
  if (err.errno === 'EADDRINUSE') {
    console.log('Error: Port ' + err.port + ' already taken!');
    console.log('Exiting...');
    process.exit(0);
  } else {
    //console.log(err);
    process.exit(1);
  }
});

//nodemon
process.stdout.isTTY = Boolean(true);

//process.on('SIGINT', function() {
//  console.log('do SIGINT');
//process.exit(0);
//});

// MongoDB Connection
mongoose.set('useCreateIndex', true);

let connect = () => {
  //return mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true }).then(() => {
  return mongoose.connect(config.app.dbURI, {useNewUrlParser: true}).then(() => {
    console.log('Successfully connected to MongoDB.');
  }).catch(err => {
    console.log('Unable to connect to MongoDB.');
    process.exit(0);
  })
};

// React 
app.use(express.static(__dirname + '/src'));

// Express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(auth.initialize());

// Back-end Routes
app.use('/api', api);

// Enables React Routing
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/src/index.html');
});

// Launch app
const server = http.createServer(app);
const io = require('socket.io')(server);
io.sockets.setMaxListeners(0);

server.listen(process.env.PORT || config.app.port, function () {
  console.log('Application starting...');
  console.log('Listening on port %d.', this.address().port);

  connect()
    .then(() => {
      // Back-end Services
      ioApiCandlesService(io);
      ioApiTickersService(io);
      ioApiBooksService(io);
      ioApiStatsService(io);
      
      dataStoreService();
    })

});

module.exports = app;
