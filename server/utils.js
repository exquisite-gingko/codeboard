var randomId = require('random-id');
var Board = require('../db/board');

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
  }
};

