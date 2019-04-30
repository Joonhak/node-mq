const amqp = require('amqplib/callback_api');
const ws = require('ws');
const mqServer = require('../mq-config')["mq-host"];

const upbit = 'wss://api.upbit.com/websocket/v1';
const socketData = [
  {ticket: 'test'},
  {
    type: 'trade',
    isOnlySnapshot: false,
    isOnlyRealtime: true,
    codes: [
      'KRW-BTC',
      'KRW-BCH',
      'KRW-ETC',
      'KRW-ETH',
      'KRW-XRP',
      'KRW-EOS',
      'KRW-ADA',
      'KRW-LTC',
      'KRW-ZIL',
      'KRW-OMG',
      'KRW-XLM',
    ],
  },
  {format: 'DEFAULT'},
];

amqp.connect(mqServer, (connErr, conn) => {
  if (connErr) throw connErr;
  console.log('Connect with rabbitMq host!');

  conn.createChannel((channErr, ch) => {
    if (channErr) throw channErr;
    console.log('Channel created!');

    const socket = new ws(upbit, {perMessageDeflate: false});
    socket.on('open', () => {
      console.log('socket connected!');

      socket.send(JSON.stringify(socketData), socketErr => {
        if (socketErr) throw socketErr;
      });

      socket.on('message', msg => {
        const recieved = JSON.parse(msg);
        const exchange = 'realtime-data';
        const key = recieved.code;
        const { trade_price, trade_volume, change_price, change } = recieved;
        const change_rate = parseFloat(((change_price / trade_price) * 100).toFixed(2));

        const msgForSend = {
          trade_price,
          trade_volume,
          trade_amount: parseInt(trade_price * trade_volume), // 원단위까지만
          change_rate: change === 'FALL' ? -(change_rate) : change_rate,
        };

        const header = { headers: {"contentType": "application/json"} };
        const stringifiedMsg = JSON.stringify(msgForSend);

        ch.assertExchange(exchange, 'topic', { durable: false });
        ch.publish(exchange, key, Buffer.from(stringifiedMsg));
        console.log(' [*] Sent %s to %s', stringifiedMsg, key, header);
      });

    });
  });
});

// amqp.connect(mqServer, (connErr, conn) => {
//   if (connErr) throw connErr;
//
//   conn.createChannel((err, ch) => {
//     if (err) throw err;
//
//     const ex = 'topic_logs';
//     const key = 'market.coin';
//     const msg = JSON.stringify({msg: 'hello world!', topic: 'market'});
//
//     ch.assertExchange(ex, 'topic', {durable: false});
//
//     ch.publish(ex, key, Buffer.from(msg));
//     console.log(" [*] Sent %s: %s", key, msg);
//   });
// });
