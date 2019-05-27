const amqp = require('amqplib');
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

amqp
  .connect(process.env.MQ_HOST)
  .then(conn => {
    console.log('Connected with RabbitMQ server!');

    conn
      .createChannel()
      .then(chann => {
        // socket prepare
        const socket = new ws(UPBIT, { perMessageDeflate: false });
        socket.on('open', socketConnectionErr => {
          if (socketConnectionErr) throw socketConnectionErr;
          console.log('Connected with UPBIT socket API!');

          socket.send(JSON.stringify(socketData), dataSendErr => {
            if (dataSendErr) throw dataSendErr;
            console.log('Requested at upbit');
          });
        });

        socket.addEventListener('message', e => {
          const received = JSON.parse(e.data);

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

          const amount = Math.round(trade_price * trade_volume);

          const tradeData = {
            price: trade_price,
            volume: trade_volume.toFixed(8),
            change_rate: change === 'FALL' ? -change_rate : change_rate,
            amount,
            code,
          };

          const headers = { contentType: 'application/json' };
          const bufferedData = Buffer.from(JSON.stringify(tradeData));

          chann.assertExchange(exchange, 'topic', { durable: false });
          chann.publish(exchange, key, bufferedData, headers);
          console.log(`[*] Sent '${bufferedData}' to '${key}'`);

          // save data to db
        });
      })
      .catch(e => {
        console.error('Create Channel Error..');
        throw e;
      });
  })
  .catch(e => {
    console.error('Rabbit Connection Error..');
    throw e;
  });
