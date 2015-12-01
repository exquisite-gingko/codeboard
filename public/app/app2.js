// # App Setup

// ##### [Back to Table of Contents](./tableofcontents.html)


// Set up app properties.

// (function () {
//   'use strict'

//   angular.module()
//     .factory('init', init);

//   function init()
// })();


var App = {};

App.init = function() {
  // Connect to sockets.io with unique ioRoom ID - either a new whiteboard or used and saved previously by [sockets.js](../docs/sockets.html)
  var ioRoom = window.location.href;
  App.socket = io(ioRoom);
  App.board;


  //**Video Chat Functionality** 

  // Create a video chat Object.
  // var webrtc = new SimpleWebRTC({
  //   // **localVideoEl**: the ID/element DOM element that will hold the current user's video
  //   localVideoEl: 'localVideo',
  //   // **remoteVideosEl**: the ID/element DOM element that will hold remote videos
  //   remoteVideosEl: 'remoteVideos',
  //   // **autoRequestMedia**: immediately ask for camera access
  //   autoRequestMedia: true
  // });

  // // The room name is the same as our socket connection.
  // webrtc.on('readyToCall', function() {
  //   webrtc.joinRoom(ioRoom);
  // });

  // **Whiteboard**
  
  // Set properties of the whiteboard.
  App.canvas = $('#whiteboard');
  App.canvas[0].width = window.innerWidth;
  App.canvas[0].height = window.innerHeight * 0.7;
  App.context = App.canvas[0].getContext("2d");

  // Set properties of the mouse click.
  App.mouse = {
    click: false,
    drag: false,
    x: 0,
    y: 0
  };

  // Initialize pen properties.
  // To add more new drawing features, i.e. different colours, thickness, add them to the ```App.pen``` object.
  App.pen = {
    fillStyle: 'solid',
    strokeStyle: '#000000',
    lineWidth: 2,
    lineCap: 'round'
  };

  App.drawType = 'free';

  App.startDrag = {
    x: undefined,
    y: undefined
  };

  App.previousDrag = {
    x: undefined,
    y: undefined
  };

  // ```App.isAnotherUserActive``` is a Boolean that signals whether another user is currently drawing. The current implementation is such that only 1 user can draw at a time, i.e. simultaneous drawing is forbidden. To get rid of this functionality, remove  ```App.isAnotherUserActive``` and conditional loops that require it. 
  App.isAnotherUserActive = false;

  // ```App.stroke``` is an array of [x,y] coordinates for one drawing element. They are stored here, emitted ([in initialize.js](../docs/initialize.html)), and sent to [sockets.js](../docs/sockets.html). Once sent, ```App.stroke``` is emptied. 
  App.stroke = [];

  // ```App.prevPixel``` contains only 1 [x,y] coordinate pair - the coordinates of the previous pixel drawn. This is used in ```App.socket.on('drag'...``` for smooth rendering of drawn elements by other users. 
  App.prevPixel = [];


  // **Methods**


  // Draw according to coordinates.
  App.draw = function(x, y) {
    App.context.lineTo(x, y);
    App.context.stroke();
  };

  App.drawRectangle = function (x1, y1, x2, y2) {
    App.context.fillStyle = 'rgba(32, 32, 32, 0.5)';
    App.context.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2));
  };

  App.removeRectangle = function (x1, y1, x2, y2) {
    App.context.clearRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x1 - x2), Math.abs(y1 - y2));
  };

  App.touchDraw = function (e) {
    e.preventDefault();
    if (lastPt !== null) {
      App.context.beginPath();
      App.context.moveTo(lastPt.x, lastPt.y);
      App.context.lineTo(e.touches[0].pageX, e.touches[0].pageY)
      App.context.stroke();
    }
    lastPt = {x: e.touches[0].pageX, y: e.touches[0].pageY};
  };

  App.touchEnd = function (e) {
    console.log('touching ended');
    e.preventDefault();
    lastPt = null;
  }

  // Initialize before drawing: copy pen properties to ```App.context```, beginPath and set the starting coordinates to ```moveToX``` and ```moveToY```.
  App.initializeMouseDown = function(pen, moveToX, moveToY) {

    // Copy over current pen properties (e.g. fillStyle).
    for (var key in pen) {
      App.context[key] = pen[key];
    }

    // Begin draw.
    App.context.beginPath();
    App.context.moveTo(moveToX, moveToY);
  };

  App.redrawBoard = function (board) {
    console.log("Joining the board.");

    // Check for null board data.
    if (board) {
      for (var i = 0; i < board.strokes.length; i++) {
        // Check for null stroke data.
        if (board.strokes[i]) {
          // Set pen and draw path.
          var strokesArray = board.strokes[i].path;
          var penProperties = board.strokes[i].pen;
          App.initializeMouseDown(penProperties, strokesArray[0][0], strokesArray[0][1]);

          // Draw the path according to the strokesArray (array of coordinate tuples).
          for (var j = 0; j < strokesArray.length; j++) {
            App.draw(strokesArray[j][0], strokesArray[j][1]);
          }
          App.context.closePath();
        }
      }
    }
  };

  // **Socket events**

  // Draw the board upon join.
  App.socket.on('join', function (board) {
    App.board = board;
    App.redrawBoard(board);
  });

  // If another user is drawing, App.socket will receive a 'drag' event. App listens for the drag event and renders the drawing element created by the other user. 
  // Note that App prevents the current user from drawing while the other user is still drawing. 
  App.socket.on('drag', function(data) {
    App.isAnotherUserActive = true;
    console.log("Receiving data from another user:", data);

    // ```App.prevPixel``` is an array of the previous coordinates sent, so drawing is smoothly rendered across different browsers. 
    // If the ```App.prevPixel``` array is empty (i.e., this is the first pixel of the drawn element), then prevPixel is set as the coordinates of the current mouseclick. 
    if (App.prevPixel.length === 0) {
      App.prevPixel = data.coords;
    }

    // Initialize beginning coordinates and drawing.
    App.initializeMouseDown(data.pen, App.prevPixel[0], App.prevPixel[1]);
    App.draw(data.coords[0], data.coords[1]);

    // Set the current coordinates as App.prevPixel, so the next pixel rendered will be smoothly drawn from these coordinate points to the next ones. 
    App.prevPixel = data.coords;

  });

  // When the user has mouseup (and finished drawing) then ```App.prevPixel``` will be emptied.
  App.socket.on('end', function() {
    App.prevPixel = [];
    App.context.closePath();
    App.isAnotherUserActive = false;
  });

};
