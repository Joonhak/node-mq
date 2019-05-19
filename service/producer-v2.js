const amqp = require('amqplib');
const ws = require('ws');
const mqServer = require('../mq-config')["mq-host"];

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

amqp.connect(mqServer)
    .then( conn => {
      console.log('Connected with RabbitMQ server!');

      conn.createChannel()
          .then( chann => {
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
              const key = received.code.toLowerCase().split('-').join('.'); // krw.btc, krw.eth ...
              const { trade_price, trade_volume, change_price, change, code } = received;
              const change_rate = Math.round( (change_price / trade_price * 10000) ) / 100;
              const trade_amount = Math.round(trade_price * trade_volume);

              const tradeData = {
                trade_price,
                trade_volume: trade_volume.toFixed(8),
                trade_amount,
                code,
                change_rate: change === 'FALL' ? - (change_rate) : change_rate,
              };
              const headers = { contentType: 'application/json' };
              const bufferedData = Buffer.from(JSON.stringify(tradeData));

              chann.assertExchange(exchange, 'topic', { durable: false });
              chann.publish(exchange, key, bufferedData, headers);

              console.log(`[*] Sent '${bufferedData}' to '${key}'`);
            });

            // send ping
          })
          .catch(e => {
            console.error('Create Channel Error..');
            throw e;
          });
    })
    .catch( e => {
      console.error('Rabbit Connection Error..');
      throw e;
    });
