var mongojs = require('mongojs'),
  transaction = require('./Transaction'),
  db = mongojs('transactions');

function doTransfer() {

  var trans = new transaction(db);

  // Error encountered.
  trans.on('error', function(err) {
    console.log(err);
    process.exit(1);
  });

  // Successfull transfer.
  trans.on('success', function() {
    console.log('Transaction has been completed');
    db.collection('users').find(function(err, data) {
      console.log(data);
      process.exit(0);
    });
  });

  trans.transfer(1234, 43210, 1000);

}

db.collection('users').remove(function() {
  console.log('Removed all users');
  db.collection('transactions').remove(function() {
    var users = [
      {
        owner: 'John Doe',
        acct_number: 1234,
        balance: 100,
        semaphore: false,
        transactions: []
      },
      {
        owner: 'Jane Doe',
        acct_number: 4321,
        balance: 100,
        semaphore: false,
        transactions: []
      }
    ];
    db.collection('users').insert(users, function() {
      console.log('Inserted users');
      doTransfer();
    });

  });
});





