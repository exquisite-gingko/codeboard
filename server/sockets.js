// # Socket Connection Handler

// ##### [Back to Table of Contents](./tableofcontents.html)

// Import board model from [board.js](../documentation/board.html)
var Board = require('../db/board');

// **boardUrl:** *String* <br>
// **board:** *Mongoose board model* <br>
// **io:** *Export of our Socket.io connection from [server.js](../documentation/server.html)*
var connect = function(boardUrl, board, io) {
  // Set the Socket.io namespace to the boardUrl.
  var whiteboard = io.of(boardUrl);
  
  whiteboard.once('connection', function(socket) {
    //Get the board that the socket is connected to.
    var id = socket.nsp.name.slice(1);
    
    // Send the current state of the board to the client immediately on joining.
    socket.emit('join', board);

    // increment #users on board
    Board.boardModel.update({id: id}, {$inc: {users: 1}}, function (err, board) {
      if (err) console.log(err);
    });

    socket.on('start', function(pen) {

      // **A stroke is essentially a continous line drawn by the user.**
      socket.stroke = {
        pen: pen,
        path: []
      };
    });

    socket.on('drag', function (coords) {
      //Push coordinates into the stroke's drawing path.
      socket.stroke.path.push(coords);
      // This payload will be sent back to all sockets *except the socket
      // that initiated the draw event.*
      var payload = {
        pen: socket.stroke.pen,
        coords: coords
      };

      //Broadcast new line coords to everyone but the person who drew it.
      socket.broadcast.emit('drag', payload);
    });

    //When stroke is finished, add it to our db.
    socket.on('end', function() {
      var finishedStroke = socket.stroke;
      console.log('end');
      console.log(finishedStroke);

      //Update the board with the new stroke.
      Board.boardModel.update({id: id},{$push: {strokes: finishedStroke} },{upsert:true},function(err, board){
        if(err){ console.log(err); }
        else {
          console.log("Successfully added");
        }
      });

      // Emit end event to everyone but the person who stopped drawing.
      socket.broadcast.emit('end', null);

      //Delete the stroke object to make room for the next stroke.
      delete socket.stroke;
    });

    socket.on('removeLastSquare', function (startCoords) {
      console.log('remove last');
      Board.boardModel.findOne({id: id})
      .then(function (board) {
        if (board.strokes.length) {
          if (board.strokes[board.strokes.length - 1].path[0][0] == startCoords[0] && board.strokes[board.strokes.length - 1].path[0][1] == startCoords[1]) {
            board.strokes.splice(board.strokes.length - 1, 1);
          }
        }
        socket.emit('removeLast');
        socket.broadcast.emit('removeLast');
        return board.save();
      })
      .catch(function (error) {
        console.log(error);
      });
    });

    socket.on('removeLast', function (startCoords) {
      console.log('remove last');
      Board.boardModel.findOne({id: id})
      .then(function (board) {
        if (board.strokes.length) {
          board.strokes.splice(board.strokes.length - 1, 1);
        }
        socket.emit('removeLast');
        socket.broadcast.emit('removeLast');
        return board.save();
      })
      .catch(function (error) {
        console.log(error);
      });
    });

    socket.on('getBoard', function () {
      Board.boardModel.findOne({id: id})
      .then(function (board) {
        console.log('get board');
        socket.emit('refreshBoard', board);
        socket.broadcast.emit('refreshBoard', board);
      })
      .catch(function (error) {
        console.log(error);
      });
    });
  });
};

// Required by [server.js](../documentation/server.html)
module.exports = connect;
