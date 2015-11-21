// # MongoDB Database Configuration

// ##### [Back to Table of Contents](./tableofcontents.html)
var mongoose = require('mongoose');

// Currently configured for deployment. Change to this for development:
// if (process.env.NODE_ENV === 'dev') {
//   mongoose.connect('mongodb://localhost');
//   // mongoose.connect('')
// } else {
//   mongoose.connect(process.env.MONGOLAB_URI);
// }
mongoose.connect('mongodb://aackerman050:hackreactor1@ds057234.mongolab.com:57234/coderboard');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(cb) {
  console.log('connected to db');
});

// Required by [Mongoose Board Model](../documentation/board.html)
module.exports = db;
