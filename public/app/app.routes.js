angular.module('app')
  .config(function ($stateProvider) {
      $stateProvider
        .state('eraser', {
          controller: 'toolbar'
        });
    });