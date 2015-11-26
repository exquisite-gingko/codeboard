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
        $rootScope.app.pen.lineWidth = 50;
        $rootScope.app.pen.strokeStyle = '#fff';
      } else {
        console.log("The user is using the pen.");
        $rootScope.app.pen.lineWidth = 5;
        console.log($rootScope.app.pen.strokeStyle);
        $rootScope.app.pen.strokeStyle = option;
        $rootScope.app.pen.lineWidth = 2;
      }
    };
    return {
      changePen: changePen
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
  }

  function switchBoardsCtrl ($http, $location) {
    var self = this;
    self.switchBoards = function () {
      console.log('running');
      console.log('/' + self.boardId);
      document.location = '/' + self.boardId;
    };
  }

  function auth ($http) {
    var self = this;

    self.signUp = function() {
      var data = { email : self.email, password: self.password };
      return $http({
        method: 'POST',
        url: '/api/signUp',
        data: data
        })
      .then(function (response) {
        console.log('response', response);
        return response;
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
        // return response;
        self.getFiles();
        document.location = '/new';
      })
      .catch(function (err) {
        console.log('Error Matching Password');
        //WANT TO LOG THIS ERROR
        console.log('Error ------', err.data.message);
        self.errorMessage = err;//WANT THIS TO SHOW ON THE LOGIN PAGE!!
      });
    };

    //THis function is currently being called when you hit the button so the first time you hit the button no data 
    //will be returned because the event to go get the data will not have returned yet
    //this is only for testing purposes though so remember to hit the button twice to check stuff here
    self.getFiles = function () {
      console.log('get files------->', self.canvases);
      return $http({
        method: 'GET',
        url: '/api/userBoards'
      })
      .then(function (response) {
        console.log('response GETTING', response);
        //append these files to the screen!
        // return response.data.messages;
        console.log(response.data.messages); //return the array of names of saved files
        //THIS LINE SHOULD OVERWRITE THE BELOW ARRAY IT DOES IN THE CONSOLE BUT NOT IN THE HTML??
        self.canvases = response.data.messages;
      })
      .catch(function (err) {
        console.log('Error Finding Any Saved Boards');
      });
    };
    //NB HARD CODED LINE
    //this hard coded line gets added to the html
    self.canvases = ['sea','sand','surf'];

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
      })
      .catch(function (err) {
        console.log('Error Saving Files');
      });
    };

    //HAVE NOT LINKED THIS FUNCTION UP YET!! CANT TEST UNTIL FRONT END HAS SAVED FILES ON IT grrr
    self.getOne = function () {
      //click on a certain one
      //get the name that clicked on
      return $http({
        method: 'GET',
        url: '/api/save'
      })
      .then(function (response) {
        document.location = '/' + self.boardId;
      })
      .catch(function (err) {
        console.log('Error getting named file');
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

  }



})();
