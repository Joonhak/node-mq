const amqp = require('amqplib/channel_api');
const mqServer = require('./mq-config')["mq-host"];

amqp.connect(mqServer)
    .then(conn => {
      conn.createChannel()
          .then( ch => {

            const ex = 'pub_sub';
            const msg = 'Hello pub sub!';

            ch.assertExchange(ex, 'fanout', { durable: false });

            ch.publish(ex, '', Buffer.from(msg));
            console.log(" [x] Sent '%s' ", msg);
          }).catch(err => {
            throw err;
          });
    }).catch(err => {
      throw err;
    });
