
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

  var lastPt = null;
  // **Mouse Events**

  // On mousedown detection, initialize drawing properties based on mouse coordinates.
  App.canvas.on('mousedown', function(e) {

    // Allow user drawing only if other users are not drawing.
    if (!App.isAnotherUserActive) {
      console.log("User has started to draw.");

      // Initialize mouse position.
      App.mouse.click = true;
      App.mouse.x = e.offsetX;
      App.mouse.y = e.offsetY;

      // ```App.initializeMouseDown``` is from [app.js](../docs/app.html) where it initializes the pen and canvas before rendeirng.
      App.initializeMouseDown(App.pen, App.mouse.x, App.mouse.y);

      // Emit the pen object through socket.
      App.socket.emit('start', App.pen);

      // Add the first mouse coordinates to the ```stroke``` array for storage.
      App.stroke.push([App.mouse.x, App.mouse.Y]);
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });


  // On mousedrag detection, start to render drawing elements based on user's cursor coordinates.
  App.canvas.on('drag', function(e) {
    // Allow user drawing only if other users are not drawing.
    if (!App.isAnotherUserActive) {
      if (App.mouse.click) {
        App.mouse.drag = true;

        // Find x,y coordinates of the mouse dragging on the anvas.
        var x = e.offsetX;
        var y = e.offsetY;

        // Render the drawing.
        App.draw(x, y);
        console.log("Currently drawing coordinates", [x, y]);

        // Continue to push coordinates to stroke array (as part of storage).
        App.stroke.push([x, y]);

        // Emit x, y in a tuple through socket.
        App.socket.emit('drag', [x, y]);
      }
    } else {
      console.log('Another user is drawing - please wait.');
    }
  });

  // On mouse dragend detection, tell socket that we have finished drawing.
  App.canvas.on('dragend', function(e) {
    if (!App.isAnotherUserActive) {
      App.mouse.drag = false;
      App.mouse.click = false;

      console.log("Drawing is finished and its data is being pushed to the server", [App.stroke, App.pen]);

      // Empty the App.stroke array.
      App.stroke = [];

      // Tell socket that we've finished sending data.
      App.socket.emit('end', null);

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
    App.mouse.click = true;
    App.mouse.x = e.touches[0].pageX;
    App.mouse.y = e.touches[0].pageY;

    // ```App.initializeMouseDown``` is from [app.js](../docs/app.html) where it initializes the pen and canvas before rendeirng.
    App.initializeMouseDown(App.pen, App.mouse.x, App.mouse.y);

    // Emit the pen object through socket. 
    App.socket.emit('start', App.pen);

    // Add the first mouse coordinates to the ```stroke``` array for storage.
    App.stroke.push([App.mouse.x, App.mouse.Y]);
  }, false);

  touchZone.addEventListener("touchmove", function (e) {
    e.preventDefault();
    if (lastPt !== null) {
      if (App.mouse.click) {
        App.mouse.drag = true;
        App.context.beginPath();
        App.context.moveTo(lastPt.x, lastPt.y);
        var x = e.touches[0].pageX;
        var y = e.touches[0].pageY;
        App.draw(x, y);
        App.stroke.push([x, y]);
        App.socket.emit('drag', [x, y]);
      }
    }
    lastPt = {x: e.touches[0].pageX, y: e.touches[0].pageY};
  }, false);

  touchZone.addEventListener("touchend", function (e) {
    e.preventDefault();
    lastPt = null;
    App.mouse.drag = false;
    App.mouse.click = false;
    App.stroke = [];
    App.socket.emit('end', null);
  }, false);


});
