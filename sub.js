const amqp = require('amqplib/channel_api');
const mqServer = require('./mq-config')["mq-host"];

amqp.connect(mqServer)
    .then(conn => {
      conn.createChannel()
          .then(ch => {

            const ex = 'pub_sub';

            ch.assertExchange(ex, 'fanout', {durable: false});

            ch.assertQueue('', {exclusive: true})
                .then(q => {
                  console.log(' [*] Waiting for messages in %s.', q.queue);
                  ch.bindQueue(q.queue, ex, '');

                  ch.consume(q.queue, function (msg) {
                    console.log(' [x] %s', msg.content.toString());
                  }, {noAck: true})
                      .catch(err => {
                        throw err;
                      });
                }).catch(err => {
                  throw err;
                });

          }).catch(err => {
        throw err;
      });
    }).catch(err => {
  throw err;
});
