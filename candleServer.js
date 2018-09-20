const WebSocket = require('ws');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/bitcoin',function () {
    console.log('mongodb connected');
});

const canldeSchema = new mongoose.Schema(
    {
        date: Number,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number
    },
    {
        versionKey:false
    }
);
const Candle = mongoose.model('Candle',canldeSchema);

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        if (message == '1') sendData();
    });

    setInterval(sendData,60000);

    const data = [
        {'$project':{_id:0}}
    ];

    function sendData() {
        Candle.aggregate(data,function (err,result) {
            if (err) console.log("Candle aggregation error");
            else {
                let rel = JSON.stringify(result);
                console.log(rel);
                ws.send(rel);
            }
        })
    }
});
