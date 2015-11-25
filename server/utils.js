var randomId = require('random-id');
var Board = require('../db/board');
var bcrypt = require('bcrypt');

module.exports = {
  activeBoards: {},
  createId: function () {
    var id = randomId(4, '0');
    this.activeBoards[id] = true;
    return id;
  },
  //not being used currently
  removeId: function (id) {
    if (activeBoards[id]) {
      delete activeBoards[id];
    } else {
      return null;
    }
  },
  encryptPassword: function(password) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            // Store hash in your password DB.
            console.log("hashed password", hash);
            return hash;
        });
    });
  },
  decrypt: function(dbPassword, typedPass) {
    bcrypt.compare(typedPass, hash, function(err, res) {
      // res == true
      console.log('PASSWORD TRUE/FALSE');

    });
  }
};

