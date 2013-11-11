var mongojs = require('mongojs'),
  events = require('events');

/**
 * Create new instance
 * @param mongoConnection
 */
var Transaction = function(mongoConnection) {

 events.EventEmitter.call(this);

 this.db = mongoConnection,
 this.users = this.db.collection('users'),
 this.transactions = this.db.collection('transactions');

}
require('util').inherits(Transaction, events.EventEmitter);

/**
 * Fail the transaction. Fail only for either sender or receiver, so basically the amount may still show up for one
 * of the parties...
 *
 * @param transactionId
 */
Transaction.prototype.failTransfer = function(target, transactionId) {
  var opts = (target == 'sender') ? {senderStatus: 'failed'} : {receiverStatus: 'failed'},
    that = this;
  this.transactions.update({ _id: transactionId}, opts);
}

/**
 * Transfer is completed for target.
 *
 * @param target
 * @param transactionId
 */
Transaction.prototype.completeTransfer = function(target, transactionId) {
  var opts = (target == 'sender') ? {senderStatus: 'completed'} : {receiverStatus: 'completed'},
    that = this;
  this.transactions.findAndModify({
    query: {
      _id: transactionId
    },
    update: {
      $set: opts
    }
  }, function(err, data) {
    // Once the status for both transactions has been set to completed, we can assume everything is OK.
    that.transactions.findOne({_id: transactionId}, function(err,data) {
      if(data.receiverStatus == 'completed' && data.senderStatus == 'completed') {
        that.emit('success','Transaction completed');
      }
    });
  });
}

/**
 * Transfer amount between senderAcct and receiverAcct
 *
 * @param senderAcct
 * @param receiverAcct
 * @param amount
 */
Transaction.prototype.transfer = function (senderAcct, receiverAcct, amount) {

  var that = this,
    transactionId;

  if(!this.db) {
    this.emit('error', 'No connection found.');
  }

  if(amount < 0) {
    this.emit('error', 'Not allowed to transfer negative amounts.');
  }

  that.transactions.save({
    sender: senderAcct,
    receiver: receiverAcct,
    amount: amount,
    senderStatus: 'pending',
    receiverStatus: 'pending'
  }, function(err, data) {

    transactionId = data._id;

    // Generic database error.
    if(err || !data) {
      that.emit('error', err);
    }

    that.users.find(
      {
        acct_number: {
          $in: [senderAcct, receiverAcct]
        }
      }, function(err, data) {
        if(err) {
          // Generic database error.
          that.failTransfer(transactionId);
          that.emit('error', err);
        } else if(data && data.length != 2) {
          // We need two documents, sender and receiver.
          that.failTransfer(transactionId);
          that.emit('error', new Error('The accounts you are trying to query do not exist.'));
        } else {
          data.forEach(function(user) {

            var settings = {
              $push: {
                // We want to keep a log of successful transactions. In case something goes wrong down the line.
                transactions: [ transactionId ]
              }
            };

            if(user.acct_number == receiverAcct) {
              // Receiving account.
              settings.$inc = {balance: amount};
              var callback = function() {
                that.completeTransfer('receiver',transactionId);
              }
            } else {
              // Sending account.
              settings.$inc = {balance: -amount};
              var callback = function(err, data) {
                that.completeTransfer('sender',transactionId);
              }
            }

            // Update the records.
            that.users.update({ acct_number: user.acct_number }, settings, {multi: false}, callback);

          });

        }

      }
    );

  });

}

module.exports = Transaction;