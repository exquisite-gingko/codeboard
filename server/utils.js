var randomId = require('random-id');
var Board = require('../db/board');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt'));

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
    return bcrypt.genSaltAsync(10)
    .then(function(salt) {
      return bcrypt.hashAsync(password, salt);
    })
    .then(function(hash) {
      console.log('hash', hash);
      return hash;
    });
  },
  decrypt: function(dbPassword, typedPass) {
    console.log('PASSWORDS',dbPassword, typedPass);
    return bcrypt.compareAsync(typedPass, dbPassword)
    .then(function(res) {
      console.log('PASSWORD TRUE/FALSE', res);
      return res;
    });
  }
};

// $2a$10$2NyVrqQbyjuXbXkSqfvZ3ulVxtKgkQnOEpTJQjsXkKJdOHcEdNYs6
// $2a$10$2NyVrqQbyjuXbXkSqfvZ3ulVxtKgkQnOEpTJQjsXkKJdOHcEdNYs6

