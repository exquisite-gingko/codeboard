// # Main Server

// ##### [Back to Table of Contents](./tableofcontents.html)

// ## Dependencies
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Board = require('./db/board');
var port = process.env.PORT || 8080;
var handleSocket = require('./server/sockets');
var utils = require('./server/utils');

// ## Routes
var id = utils.createId();
console.log(typeof id);

// **Static folder for serving application assets**
app.use('/', express.static(__dirname + '/public'));

// **Static folder for serving documentation**
app.use('/documentation', express.static(__dirname + '/docs'));

// **Home Page**
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// **Documentation Page**
app.get('/documentation', function(req, res) {
  res.sendFile(__dirname + '/docs/tableofcontents.html');
});


// **Get a new whiteboard**
app.get('/new', function(req, res) {
  // Create a new mongoose board model.
  var id = utils.createId();
  var board = new Board.boardModel({
    id: id,
    users: 0,
    strokes: []
  });
  board.save()
  .then(function (board) {
    res.redirect('/' + id);
  })
  .catch(function (err) {
    console.log(err);
    res.redirect('/');
  });
});


// **Wildcard route & board id handler.**
app.get('/*', function(req, res) {
  var id = req.url.slice(1);
  Board.boardModel.findOne({id: id})
  .then(function (board) {
    board.users++;
    return  board.save();
  })
  .then(function (savedBoard) {
    console.log(savedBoard.users);
    // Invoke [request handler](../documentation/sockets.html) for a new socket connection
    // with board id as the Socket.io namespace.
    handleSocket(req.url, savedBoard, io);
    // Send back whiteboard html template.
    res.sendFile(__dirname + '/public/board.html');
  })
  .catch(function (err) {
    res.redirect('/');
  });
});

// **Start the server.**
http.listen(port, function() {
  console.log('server listening on', port, 'at', new Date());
});
