const amqp = require('amqplib/callback_api');
require('dotenv').config;

amqp.connect(process.env.MQ_HOST, (connErr, conn) => {
  if (connErr) throw connErr;

  conn.createChannel((err, ch) => {
    if (err) throw err;

    const ex = 'realtime-data';
    const key = 'KRW-BTC';

    ch.assertExchange(ex, 'topic', { durable: false });

    ch.assertQueue('', { exclusive: true }, (err, q) => {
      ch.bindQueue(q.queue, ex, key);

      ch.consume(
        q.queue,
        msg => {
          console.log(
            ' [x] Received: %s:',
            msg.fields.routingKey,
            JSON.parse(msg.content)
          );
        },
        { noAck: true }
      );
    });
  });
});
