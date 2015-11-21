(function () {

  'use strict'

  angular.module('app')
    .factory('canvasFactory', canvasFactory);

  function canvasFactory () {
    
    var services = {
      init: init,
      listeners: listeners
    };

    return services;

    function init () {

      this.canvas = $('#whiteboard');
      this.canvas[0].width = window.innerWidth;
      this.canvas[0].height = window.innerHeight * 0.7;
      this.context = this.canvas[0].getContext("2d");

      // Set properties of the mouse click.
      this.mouse = {
        click: false,
        drag: false,
        x: 0,
        y: 0
      };

      // Initialize pen properties.
      // To add more new drawing features, i.e. different colours, thickness, add them to the ```this.pen``` object.
      this.pen = {
        fillStyle: 'solid',
        strokeStyle: '#000000',
        lineWidth: 2,
        lineCap: 'round'
      };

      // ```this.isAnotherUserActive``` is a Boolean that signals whether another user is currently drawing. The current implementation is such that only 1 user can draw at a time, i.e. simultaneous drawing is forbidden. To get rid of this functionality, remove  ```this.isAnotherUserActive``` and conditional loops that require it. 
      this.isAnotherUserActive = false;

      // ```this.stroke``` is an array of [x,y] coordinates for one drawing element. They are stored here, emitted ([in initialize.js](../docs/initialize.html)), and sent to [sockets.js](../docs/sockets.html). Once sent, ```this.stroke``` is emptied. 
      this.stroke = [];

      // ```this.prevPixel``` contains only 1 [x,y] coordinate pair - the coordinates of the previous pixel drawn. This is used in ```this.socket.on('drag'...``` for smooth rendering of drawn elements by other users. 
      this.prevPixel = [];

      this.draw = function () {
        this.context.lineTo(x, y);
        this.context.stroke();
      }

      this.touchEnd = function (e) {
        console.log('touching ended');
        e.preventDefault();
        lastPt = null;
      }

      // Initialize before drawing: copy pen properties to ```App.context```, beginPath and set the starting coordinates to ```moveToX``` and ```moveToY```.
      this.initializeMouseDown = function (pen, moveToX, moveToY) {

        // Copy over current pen properties (e.g. fillStyle).
        for (var key in pen) {
          this.context[key] = pen[key];
        }

        // Begin draw.
        this.context.beginPath();
        this.context.moveTo(moveToX, moveToY);
      };

      var ioRoom = window.location.href;
      this.socket = io(ioRoom);

      this.socket.on('join', function(board) {
        console.log("Joining the board.");

        // Check for null board data.
        if (board) {
          for (var i = 0; i < board.strokes.length; i++) {
            // Check for null stroke data.
            if (board.strokes[i]) {
              // Set pen and draw path.
              var strokesArray = board.strokes[i].path;
              var penProperties = board.strokes[i].pen;
              this.initializeMouseDown(penProperties, strokesArray[0][0], strokesArray[0][1]);

              // Draw the path according to the strokesArray (array of coordinate tuples).
              for (var j = 0; j < strokesArray.length; j++) {
                this.draw(strokesArray[j][0], strokesArray[j][1]);
              }
              this.context.closePath();
            }
          }
        }
      });


      // If another user is drawing, this.socket will receive a 'drag' event. this listens for the drag event and renders the drawing element created by the other user. 
      // Note that this prevents the current user from drawing while the other user is still drawing. 
      this.socket.on('drag', function(data) {
        this.isAnotherUserActive = true;
        console.log("Receiving data from another user:", data);

        // ```this.prevPixel``` is an array of the previous coordinates sent, so drawing is smoothly rendered across different browsers. 
        // If the ```this.prevPixel``` array is empty (i.e., this is the first pixel of the drawn element), then prevPixel is set as the coordinates of the current mouseclick. 
        if (this.prevPixel.length === 0) {
          this.prevPixel = data.coords;
        }

        // Initialize beginning coordinates and drawing.
        this.initializeMouseDown(data.pen, this.prevPixel[0], this.prevPixel[1]);
        this.draw(data.coords[0], data.coords[1]);

        // Set the current coordinates as this.prevPixel, so the next pixel rendered will be smoothly drawn from these coordinate points to the next ones. 
        this.prevPixel = data.coords;

      });

      // When the user has mouseup (and finished drawing) then ```this.prevPixel``` will be emptied.
      this.socket.on('end', function() {
        this.prevPixel = [];
        this.context.closePath();
        this.isAnotherUserActive = false;
      });
    }

  }
})();