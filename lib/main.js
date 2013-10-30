(function() {

    var transaction;

    //Requiring files
    trans = require ('./transaction');
    console.log( trans.transaction(1,2,200.9) );

}).call(this)