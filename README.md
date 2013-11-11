node-js-transaction
===================

Project to use transactions using MongoDB and NodeJS. There are no transactions available at this time in MongoDB but
there might be support some day (http://www.tokutek.com/2013/04/mongodb-multi-statement-transactions-yes-we-can/).

Two phase commits have not been fully implemented. (http://docs.mongodb.org/manual/tutorial/perform-two-phase-commits/).

Uses the events emitter to manage state information.

## Usage
See lib/main.js for example usage.

<pre><code>
node lib/main.js
</code></pre>

## Sources
* http://docs.mongodb.org/manual/tutorial/perform-two-phase-commits/