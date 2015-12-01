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
    // Set changePen method.
    // Note that an eraser is simply a white pen, not actually erasing [x,y] tuples from the database. 
    .service('tools', tools);

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
    return {
      changePen: changePen,
      drawSquare: drawSquare
    };
  }

  function toolBar ($element, tools) {
    var self = this;
    self.changePen = function (option) {
      tools.changePen(option);
      console.log("The user chose the tool", $element);
      $('input').not($('#' + option)).attr('checked', false);
    };
    self.drawSquare = function () {
      tools.drawSquare();
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

})();
