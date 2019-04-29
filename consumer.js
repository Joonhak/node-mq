const amqp = require('amqplib/callback_api');
const mqServer = require('./mq-config')["mq-host"];

const queue = 'mq-test';

amqp.connect(mqServer, (connErr, conn) => {
  if (connErr) throw connErr;

  conn.createChannel( (err, ch) => {
    if (err) throw err;

    ch.assertQueue(queue, {durable: false});

    console.log(" [*] Waiting for messages in %s. To exit press CTRL + C", queue);

    ch.consume(queue, msg => {
      console.log(" [x] Received %s", msg.content.toString());
    }, {noAck: true});
  });
});
