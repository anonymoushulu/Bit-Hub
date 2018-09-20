const mongoose = require('mongoose');
const WebSocket = require('ws');

mongoose.connect('mongodb://localhost/bitcoin',function () {
    console.log('mongodb connected');
});

const candleSchema = new mongoose.Schema(
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

candleSchema.index({date:-1});

const Candle = mongoose.model('Candle',candleSchema);

const msg = JSON.stringify({
    event: 'subscribe',
    channel: 'candles',
    key: 'trade:1m:tBTCUSD'
});

const ws = new WebSocket('wss://api.bitfinex.com/ws/2');

ws.on('open',function() {
    ws.send(msg);
});

let i=0;

ws.on('message', (event) => {
    i++;
    let point = {};
    if(i > 3){ // the third message is recent 2 hours' data
        let data = strToArr(event);
        if(data.length === 6) {
            [point.date,point.open,point.high,point.low,point.close,point.volume] = [data[0],data[1],data[3],data[4],data[2],data[5]];
            Candle.find({date:point.date}, (err,result) => {
                if (!result.length) {
                    Candle.create(point, err => {
                        if (err) console.log(err);
                        else console.log('Stored ' + point.date + new Date());
                    })
                } else {
                    Candle.update(
                        {date:point.date},
                        {$set:{open:point.open,
                               close:point.close,
                               high:point.high,
                               low:point.low,
                               volume:point.volume
                               }},
                        function (err) {
                            if (err) console.log(err);
                            else console.log('Updated ' + point.date + new Date());
                        }
                    )
                }
            })
        }
    }
});

function strToArr(str){
    str = str.replace(/\[/g,'').replace(/\]/g,'').split(',');
    str.shift();
    for(let i=0;i<str.length;i++){
        str[i] = parseFloat(str[i]);
    }
    return str;
}


