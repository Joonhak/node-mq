const amqp = require('amqplib/callback_api');
const mqServer = require('./mq-config')["mq-host"];

const queue = 'mq-test';

amqp.connect(mqServer, (connErr, conn) => {
  if (connErr) throw connErr;

  conn.createChannel( (err, ch) => {
    if (err) throw err;

    ch.assertQueue(queue, {durable: false});

    ch.sendToQueue(queue, Buffer.from('Something to Send!'));
    console.log(" [x] Sent 'Something to Send!' ");
  });

  setTimeout( () => {
    conn.close();
    process.exit(0);
  }, 1000);
});
