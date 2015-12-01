// # Whiteboard Angular Components

// ##### [Back to Table of Contents](./tableofcontents.html)

// Initialize the whiteboard module.
(function () {
  'use strict';

  angular.module('whiteboard', ['ngAnimate','ui.router'])
    .config(function($stateProvider) {
      $stateProvider
        .state('eraser', {
          controller: 'toolbar'
        });
    })
    // Set App to the root scope. 
    .controller('canvas', function($rootScope, tools) {
      $rootScope.app = App;
    })
    // Set toolbar for colour palette and eraser. 
    .controller('toolbar', toolBar)
    .controller('switchBoardsController', switchBoardsCtrl)
    .controller('auth', auth)
    .controller('popOut', function($scope) {

    })
    .factory('keyboard', keyboard)
    // Set changePen method.
    // Note that an eraser is simply a white pen, not actually erasing [x,y] tuples from the database. 
    .service('tools', tools);

  var keyDisplay = false;

  function keyboard () {

    var toggle = function () {
      keyDisplay = !keyDisplay;
      console.log(keyDisplay);
    };

    var state = function () {
      return keyDisplay;
    };

    return {
      toggle: toggle,
      state: state
    };
  }

  function tools ($rootScope) {
    var changePen = function(option) {
      if (option === 'eraser') {
        console.log("The user is using the eraser.");
        $('html,body').css('cursor','crosshair');
        $rootScope.app.drawType = 'free';
        $rootScope.app.pen.lineWidth = 50;
        $rootScope.app.pen.strokeStyle = '#fff';
      } else {
        console.log("The user is using the pen.");
        $rootScope.app.pen.lineWidth = 5;
        console.log($rootScope.app.pen.strokeStyle);
        $rootScope.app.drawType = 'free';
        $rootScope.app.pen.strokeStyle = option;
        $rootScope.app.pen.lineWidth = 2;
      }
    };
    var drawSquare = function () {
      console.log('drawing square');
      $rootScope.app.drawType = 'rectangle';
    };
    var removeLast = function () {
      $rootScope.app.removeLast();
    };
    return {
      changePen: changePen,
      drawSquare: drawSquare,
      removeLast: removeLast
    };
  }

  function toolBar ($element, tools, keyboard) {
    var self = this;
    self.changePen = function (option) {
      tools.changePen(option);
      console.log("The user chose the tool", $element);
      $('input').not($('#' + option)).attr('checked', false);
    };
    self.boardOut = false;
    self.keyboardToggle = function () {
      keyboard.toggle();
    };
    self.keyboardState = function() {
      return keyboard.state();
    };
    self.drawSquare = function () {
      tools.drawSquare();
    };
    self.removeLast = function () {
      tools.removeLast();
    };
  }

  function switchBoardsCtrl ($http, $location) {
    var self = this;
    self.switchBoards = function () {
      console.log('running');
      console.log('/' + self.boardId);
      document.location = '/' + self.boardId;
    };
  }

//--------------------------------Auth Ctrl------------------------------------------//

  function auth ($http) {
    var self = this;
    self.canvases = [];

    self.signUp = function() {
      var data = { email : self.email, password: self.password };
      return $http({
        method: 'POST',
        url: '/api/signUp',
        data: data
        })
      .then(function (response) {
        console.log('signin response received');
        document.location = '/new';
      })
      .catch(function (err) {
        console.log('Error Saving Credentials');
      });
    };


    self.login = function() {
      console.log('in login FUNCTION');
      var data = { email : self.email, password: self.password };
      return $http({
        method: 'POST',
        url: '/api/login',
        data: data
        })
      .then(function (response) {
        console.log('response login', response);
        document.location = '/new';
      })
      .catch(function (err) {
        console.log('Error Matching Password');
        self.errorMessage = err;//WANT THIS TO SHOW ON THE LOGIN PAGE
      });
    };

    //find all the users files and show to the user in drop down
    self.getFiles = function () {
      console.log('CLICKED!!');
      return $http({
        method: 'GET',
        url: '/api/userBoards'
      })
      .then(function (response) {
        console.log('response GETTING', response);
        //append these files to the screen!
        // return response.data.messages;
        var arrayRec = response.data.messages; //return the array of names of saved files
        self.canvases = [];
        for (var i = 0; i < arrayRec.length; i++) {
          if (arrayRec[i][0] !== 'null') {
            self.canvases.push(arrayRec[i]);
          }
        }
        console.log('CANVASES!!', self.canvases);

      })
      .catch(function (err) {
        console.log('Error Finding Any Saved Boards');
      });
    };

    
    //function to update the board currently on with a new file name
    self.saveFile = function () {
      console.log('saving FILES!');
      //get the path from the url
      var boardId = document.location.pathname;
      //remove the slash from the front of the path
      boardId = boardId.slice(1);
      var data = { fileName: self.fileName, boardId: boardId };
      return $http({
        method: 'POST',
        url: '/api/save',
        data: data
      })
      .then(function (response) {
        console.log('response SAVE', response);
        //trigger get function to update the files available to the user
        self.getFiles();
        console.log('Called getFiles, now changing state to "whiteboard"');
        document.location = '/new';

      })
      .catch(function (err) {
        console.log('Error Saving Files');
      });
    };

    self.logout = function () {

      return $http({
        method: 'DELETE',
        url: '/api/logout'
      })
      .then(function (response) {
        console.log('logged out');
        //now want to disable the logout button
      })
      .catch(function (err) {
        console.log('Error loging out');
      });


    };
    self.getFiles();

  }



})();
