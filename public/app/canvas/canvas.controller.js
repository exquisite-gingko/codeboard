(function () {
  'use strict'
  angular.module('app')
    .controller('canvas', function ($rootScope, tools, canvasFactory) {
      $rootScope.app = new canvasFactory.init();
      
    });

})();