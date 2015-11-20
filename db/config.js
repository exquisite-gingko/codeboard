// # MongoDB Database Configuration

// ##### [Back to Table of Contents](./tableofcontents.html)
var mongoose = require('mongoose');

// Currently configured for deployment. Change to this for development:
if (process.env.MONGOLAB_URI) {
  mongoose.connect(process.env.MONGOLAB_URI);
} else {
  mongoose.connect('mongodb://127.0.0.1');
}

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(cb) {
  console.log('connected to db');
});

// Required by [Mongoose Board Model](../documentation/board.html)
module.exports = db;
