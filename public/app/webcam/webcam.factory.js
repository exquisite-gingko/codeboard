(function() {
  'use strict';

  angular.module('webcam')
  .factory('webcamFactory', webcamFactory);

  webcamFactory.$inject = [];

  function webcamFactory() {
    var services = {
      init: init,
    };

    return services;

    function init() {

    }
  }

})();
