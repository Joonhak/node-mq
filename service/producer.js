const amqp = require('amqplib/callback_api');
const ws = require('ws');
const mqServer = require('../mq-config')["mq-host"];

const queue = 'mq-test';
const upbit = 'wss://api.upbit.com/websocket/v1';
const socketData = [
  { ticket: 'test' },
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
  { format: 'DEFAULT' },
];

// const socket = new ws(upbit, { perMessageDeflate: false });
// socket.on('open', () => {
//   console.log('socket connected!');
//
//   console.log(JSON.stringify(socketData));
//
//   socket.send(JSON.stringify(socketData), (err, result) => {
//     if (err) throw err;
//     console.log(result);
//   });
//
//   socket.on('message', msg => {
//     console.log(JSON.parse(msg));
//   });
//
// });

amqp.connect(mqServer, (connErr, conn) => {
  if (connErr) throw connErr;

  conn.createChannel( (err, ch) => {
    if (err) throw err;

    const ex = 'topic_logs';
    const key = 'market.coin';
    const msg = JSON.stringify({ msg: 'hello world!', topic: 'market' });

    ch.assertExchange(ex, 'topic', { durable: false });

    ch.publish(ex, key, Buffer.from(msg));
    console.log(" [*] Sent %s: %s", key, msg);
  });
});
