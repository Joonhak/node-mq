const amqp = require('amqplib/callback_api');
const ws = require('ws');
require('dotenv').config;

const UPBIT = 'wss://api.upbit.com/websocket/v1';
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
      'KRW-LTC',
      'KRW-EOS',
      'KRW-OMG',
      'KRW-ADA',
      'KRW-XRP',
      'KRW-XLM',
      'KRW-ZIL',
    ],
  },
  { format: 'DEFAULT' },
];

amqp.connect(process.env.MQ_HOST, (connErr, conn) => {
  if (connErr) throw connErr;
  console.log('Connect to rabbitMq server!');

  conn.createChannel((channErr, ch) => {
    if (channErr) throw channErr;
    console.log('Channel created!');

    const socket = new ws(UPBIT, { perMessageDeflate: false });
    socket.on('open', () => {
      console.log('socket connected!');

      socket.send(JSON.stringify(socketData), socketErr => {
        if (socketErr) throw socketErr;
      });

      socket.on('message', msg => {
        const received = JSON.parse(msg);
        const exchange = 'data.trade';
        const key = received.code
          .toLowerCase()
          .split('-')
          .join('.'); // krw.btc, krw.eth ...

        const {
          trade_price,
          trade_volume,
          change_price,
          change,
          code,
        } = received;

        const change_rate =
          Math.round((change_price / trade_price) * 10000) / 100;

        const trade_amount = Math.round(trade_price * trade_volume);

        const tradeData = {
          trade_price,
          trade_volume,
          trade_amount,
          change_rate: change === 'FALL' ? -change_rate : change_rate,
          code,
        };

        const headers = { contentType: 'application/json' };
        const bufferedMessage = Buffer.from(JSON.stringify(tradeData));

        ch.assertExchange(exchange, 'topic', { durable: false });
        ch.publish(exchange, key, bufferedMessage, headers);

        console.log('[*] Sent "%s" to %s', bufferedMessage, key);

        // save data to db
      });
    });
  });
});
