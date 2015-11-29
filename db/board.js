// # Mongoose Board Model & Schema

// ##### [Back to Table of Contents](./tableofcontents.html)

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var db = require('./config');

var boardSchema = new mongoose.Schema({
  id: String,
  boardName: String,
  userEmail: String,
  users: Number,
  strokes: Array
});

var usersSchema = new mongoose.Schema({
  email: String,
  password: String
});


var Board = mongoose.model('board', boardSchema);
var User = mongoose.model('user', usersSchema);

// Required by [Server](../documentation/server.html) & [Socket Connection Handler](../documentation/sockets.html)
module.exports.boardModel = Board;
module.exports.userModel = User;


