const amqp = require('amqplib/callback_api');
const mqServer = require('./mq-config')["mq-host"];

amqp.connect(mqServer, (connErr, conn) => {
  if (connErr) throw connErr;

  conn.createChannel( (err, ch) => {
    if (err) throw err;

    const ex = 'topic_logs';
    const key = 'market.coin';

    ch.assertExchange(ex, 'topic', {durable: false});

    ch.assertQueue('', { exclusive: true }, (err, q) => {
      ch.bindQueue(q.queue, ex, key);

      ch.consume(q.queue, msg => {
        console.log(" [x] Received: %s:", msg.fields.routingKey, JSON.parse(msg.content));
      }, {noAck: true});
    });
  });
});
