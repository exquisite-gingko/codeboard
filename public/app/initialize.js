
// # App Initialization

// ##### [Back to Table of Contents](./tableofcontents.html)



// Initialize the app.

$(function() {
  // Set up all app properties listed in [app.js](../docs/app.html).
  App.init();

  // Set up video to be draggable.
  $('#localVideo').draggable();
  $('#remoteVideos').draggable();

  // Add the button collapse init for materialize
  $(".button-collapse").sideNav();
  $(".dropdown-button").dropdown();

  $('.collapsible').collapsible({
      accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
  });

   $('.modal-trigger').leanModal();
   

  var lastPt = null;
  // **Mouse Events**

  // On mousedown detection, initialize drawing properties based on mouse coordinates.
  App.canvas.on('mousedown', function(e) {
    App.startDrag = {
      x: e.offsetX,
      y: e.offsetY
    };
    App.previousDrag = {
      x: e.offsetX,
      y: e.offsetY
    };
    console.log('mousedown');
    console.log(App.startDrag);

    // Allow user drawing only if other users are not drawing.
    if (!App.isAnotherUserActive) {     
      console.log("User has started to draw.");
      console.log(App.drawType);
      if (App.drawType === 'free') {
        start(e.offsetX, e.offsetY);
      } else if (App.drawType === 'rectangle') {
        drawRectangle.start(e.offsetX, e.offsetY);
      }
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });


  // On mousedrag detection, start to render drawing elements based on user's cursor coordinates.
  App.canvas.on('drag', function(e) {
    // Allow user drawing only if other users are not drawing.
    App.previousDrag = {
      x: e.offsetX,
      y: e.offsetY
    };
    if (!App.isAnotherUserActive) {
      if (App.mouse.click) {
        if (App.drawType === 'free') {
          drag(e.offsetX, e.offsetY);
        } else if (App.drawType === 'rectangle') {
          drawRectangle.drag(e.offsetX, e.offsetY);
        }
      }
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });

  // On mouse dragend detection, tell socket that we have finished drawing.
  App.canvas.on('dragend', function(e) {
    console.log('before if');
    if (!App.isAnotherUserActive) {
      if (App.drawType === 'free') {
        end();
      } else if (App.drawType === 'rectangle') {
        console.log('after if');
        drawRectangle.end(App.previousDrag.x, App.previousDrag.y);
      }
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });

  // If the cursor leaves the canvas whiteboard, simply stop drawing any more elements (by triggering a 'dragend' event).
  App.canvas.on('mouseleave', function (e) {
    App.canvas.trigger('dragend');
  });

  //Here we can start making HTML5 code for touch events:
  //We have to manually select the canvas space being used to add touch events
  var touchZone = document.getElementById("whiteboard");

  touchZone.addEventListener("touchstart", function (e) {
    start(e.touches[0].pageX, e.touches[0].pageY);
  }, false);

  touchZone.addEventListener("touchmove", function (e) {
    console.log('touching');
    e.preventDefault();
    if (lastPt !== null) {
      if (App.mouse.click) {
        App.context.beginPath();
        App.context.moveTo(lastPt.x, lastPt.y);
        drag(e.touches[0].pageX, e.touches[0].pageY)
      }
    }
    lastPt = {x: e.touches[0].pageX, y: e.touches[0].pageY};
  }, false);

  touchZone.addEventListener("touchend", function (e) {
    e.preventDefault();
    lastPt = null;
    end();
  }, false);

  function start (xCoord, yCoord) {
    App.mouse.click = true;
    App.mouse.x = xCoord;
    App.mouse.y = yCoord;

    // ```App.initializeMouseDown``` is from [app.js](../docs/app.html) where it initializes the pen and canvas before rendeirng.
    App.initializeMouseDown(App.pen, App.mouse.x, App.mouse.y);

    // Emit the pen object through socket. 
    App.socket.emit('start', App.pen);

    // Add the first mouse coordinates to the ```stroke``` array for storage.
    App.stroke.push([App.mouse.x, App.mouse.Y]);
    App.socket.emit('drag', [App.mouse.x, App.mouse.y]);
  }

  function drag (xCoord, yCoord) {
    App.mouse.drag = true;

    // Find x,y coordinates of the mouse dragging on the anvas.
    var x = xCoord;
    var y = yCoord;

    // Render the drawing.
    App.draw(x, y);
    console.log("Currently drawing coordinates", [x, y]);

    // Continue to push coordinates to stroke array (as part of storage).
    App.stroke.push([x, y]);

    // Emit x, y in a tuple through socket. 
    App.socket.emit('drag', [x, y]);
  }

  function end () {
    App.mouse.drag = false;
    App.mouse.click = false;

    console.log("Drawing is finished and its data is being pushed to the server", [App.stroke, App.pen]);

    // Empty the App.stroke array.
    var finishedStroke = {
      pen: App.pen,
      stroke: App.stroke
    };
    App.board.strokes.push(finishedStroke);
    App.stroke = [];

    // Tell socket that we've finished sending data.
    App.socket.emit('end', null);
  };

  var drawRectangle = {
    start: function (x, y) {
      App.mouse.click = true;
      App.mouse.x = x;
      App.mouse.y = y;

      // ```App.initializeMouseDown``` is from [app.js](../docs/app.html) where it initializes the pen and canvas before rendeirng.
      App.initializeMouseDown(App.pen, App.mouse.x, App.mouse.y);

      // Emit the pen object through socket. 
      App.socket.emit('start', App.pen);

      // Add the first mouse coordinates to the ```stroke``` array for storage.
      App.stroke.push([App.mouse.x, App.mouse.Y]);
    },
    drag: function (x, y) {
      console.log('drag ', App.startDrag.x, ' ', App.startDrag.y, ' ', x, ' ', y);
      App.socket.emit('removeLast', [App.startDrag.x, App.startDrag.y]);
      App.socket.emit('start', App.pen);
      App.socket.emit('drag', [App.startDrag.x, App.startDrag.y]);
      App.socket.emit('drag', [App.startDrag.x, y]);
      App.socket.emit('drag', [x, y]);
      App.socket.emit('drag', [x, App.startDrag.y]);
      App.socket.emit('drag', [App.startDrag.x, App.startDrag.y]);
      App.socket.emit('end', null);
    },
    end: function (x, y) {
      console.log('end ', App.startDrag.x, ' ', App.startDrag.y, ' ', x, ' ', y);
      App.socket.emit('removeLast', [App.startDrag.x, App.startDrag.y]);
      App.socket.emit('start', App.pen);
      App.socket.emit('drag', [App.startDrag.x, App.startDrag.y]);
      App.socket.emit('drag', [App.startDrag.x, y]);
      App.socket.emit('drag', [x, y]);
      App.socket.emit('drag', [x, App.startDrag.y]);
      App.socket.emit('drag', [App.startDrag.x, App.startDrag.y]);
      App.socket.emit('end', null);
      console.log(App.board);
      App.clearBoard();
      App.socket.emit('getBoard');
    }
  };

});
