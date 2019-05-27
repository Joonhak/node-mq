const amqp = require('amqplib/channel_api');
require('dotenv').config;

amqp
  .connect(process.env.MQ_HOST)
  .then(conn => {
    conn
      .createChannel()
      .then(ch => {
        const ex = 'pub_sub';
        const msg = 'Hello pub sub!';

        ch.assertExchange(ex, 'fanout', { durable: false });

        ch.publish(ex, '', Buffer.from(msg));
        console.log(" [x] Sent '%s' ", msg);
      })
      .catch(err => {
        throw err;
      });
  })
  .catch(err => {
    throw err;
  });
