// # Whiteboard Angular Components

// ##### [Back to Table of Contents](./tableofcontents.html)

// Initialize the whiteboard module.
(function () {
  'use strict';

  angular.module('whiteboard', ['ui.router'])
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
    // Set changePen method.
    // Note that an eraser is simply a white pen, not actually erasing [x,y] tuples from the database. 
    .service('tools', tools);

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
        $rootScope.app.pen.strokeStyle = option;
        $rootScope.app.pen.lineWidth = 2;
      }
    };
    return {
      changePen: changePen
    };
  }

  function toolBar ($element, tools) {
    var self = this;
    self.changePen = function (option) {
      tools.changePen(option);
      console.log("The user chose the tool", $element);
      $('input').not($('#' + option)).attr('checked', false);
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


    self.getFiles = function () {
      return $http({
        method: 'GET',
        url: '/api/userBoards'
      })
      .then(function (response) {
        console.log('response GETTING', response);
        //append these files to the screen!
        // return response.data.messages;
        console.log(response.data.messages); //return the array of names of saved files
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
        res.status(500).json({message:'Board Not Found'});
      });

    };

  }



})();
