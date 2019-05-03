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
  console.log('Connect with rabbitMq server!');

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
        const received = JSON.parse(msg);
        const exchange = 'trade-data';
        const key = received.code.split('-')[0]; // KRW, BTC, ETH
        const { trade_price, trade_volume, change_price, change, code } = received;
        const change_rate = Math.round(((change_price / trade_price) * 10000)) / 100;
        const trade_amount = Math.round(trade_price * trade_volume);

        const msgForSend = {
          trade_price,
          trade_volume,
          trade_amount,
          change_rate: change === 'FALL' ? -(change_rate) : change_rate,
          code,
        };

        const header = {"contentType": "application/json"};
        const bufferedMessage = Buffer.from(JSON.stringify(msgForSend));

        ch.assertExchange(exchange, 'topic', { durable: false });
        ch.publish(exchange, key, bufferedMessage, header);

        console.log('[*] Sent "%s" to %s', bufferedMessage, key);
      });

    });
  });
});
